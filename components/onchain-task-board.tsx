"use client";

import { Check, Handshake, RotateCcw, ShieldAlert, TimerReset, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { formatUnits, keccak256, stringToHex } from "viem";
import { useAccount, useChainId, usePublicClient, useReadContract, useReadContracts, useSwitchChain, useWriteContract } from "wagmi";
import { ensureArcTestnet } from "@/lib/arc-wallet";
import { marketplaceAbi } from "@/lib/contractAbi";
import { ARC_CHAIN_ID, MARKETPLACE_ADDRESS } from "@/lib/constants";

const statusNames = ["Open", "InProgress", "ProofSubmitted", "Completed", "Disputed", "Cancelled", "AutoReleased"] as const;
type ActionName = "acceptTask" | "confirmCompletion" | "openDispute" | "cancelOpenTask" | "autoRelease";
type ChainTask = readonly [bigint, `0x${string}`, `0x${string}`, bigint, bigint, number, `0x${string}`, `0x${string}`, bigint, bigint];

function sameAddress(a?: string, b?: string) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

function short(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function OnchainTaskBoard() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [proofs, setProofs] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");

  const ownerQuery = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: "owner",
    query: { refetchInterval: 8_000 }
  });
  const nextTaskQuery = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: "nextTaskId",
    query: { refetchInterval: 4_000 }
  });

  const taskIds = useMemo(() => {
    const next = nextTaskQuery.data ? Number(nextTaskQuery.data) : 1;
    const count = Math.min(Math.max(next - 1, 0), 100);
    return Array.from({ length: count }, (_, index) => BigInt(count - index));
  }, [nextTaskQuery.data]);

  const tasksQuery = useReadContracts({
    contracts: taskIds.map((id) => ({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceAbi,
      functionName: "tasks",
      args: [id]
    })),
    query: { enabled: taskIds.length > 0, refetchInterval: 4_000 }
  });

  const tasks = (tasksQuery.data ?? [])
    .map((result, index) => ({ id: taskIds[index], task: result.status === "success" ? (result.result as unknown as ChainTask) : null }))
    .filter((item): item is { id: bigint; task: ChainTask } => Boolean(item.task && item.task[0] > 0n));

  async function prepareWallet() {
    if (!address) throw new Error("Connect wallet first");
    if (chainId !== ARC_CHAIN_ID) {
      try {
        await switchChainAsync({ chainId: ARC_CHAIN_ID });
      } catch {
        // direct provider path below handles wallets that do not expose wagmi switch cleanly
      }
    }
    await ensureArcTestnet();
  }

  async function refresh() {
    await Promise.all([nextTaskQuery.refetch(), tasksQuery.refetch(), ownerQuery.refetch()]);
  }

  async function call(taskId: bigint, name: ActionName, label: string) {
    try {
      await prepareWallet();
      setStatus("Wallet tx");
      const txHash = await writeContractAsync({
        chainId: ARC_CHAIN_ID,
        address: MARKETPLACE_ADDRESS,
        abi: marketplaceAbi,
        functionName: name,
        args: [taskId],
        gas: 190_000n
      });
      setStatus("Wait confirmation");
      await publicClient?.waitForTransactionReceipt({ hash: txHash });
      setStatus(`${label}: ${txHash.slice(0, 10)}...`);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Transaction failed");
    }
  }

  async function submitProof(taskId: bigint) {
    try {
      await prepareWallet();
      const note = proofs[taskId.toString()] || `proof:${taskId}:${Date.now()}`;
      const proofHash = keccak256(stringToHex(note));
      setStatus("Wallet tx");
      const txHash = await writeContractAsync({
        chainId: ARC_CHAIN_ID,
        address: MARKETPLACE_ADDRESS,
        abi: marketplaceAbi,
        functionName: "submitProof",
        args: [taskId, proofHash],
        gas: 150_000n
      });
      setStatus("Wait confirmation");
      await publicClient?.waitForTransactionReceipt({ hash: txHash });
      setStatus(`Proof submitted: ${txHash.slice(0, 10)}...`);
      await refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Transaction failed");
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-black/10 pb-5">
        <div>
          <h1 className="text-3xl font-black">On-chain dashboard</h1>
          <p className="mt-1 text-black/70">All RentAHuman tasks from the current Arc escrow contract.</p>
        </div>
        <button className="btn btn-soft" type="button" onClick={refresh}>
          Refresh
        </button>
      </div>

      <div className="mt-4 rounded-md border border-black/10 bg-white p-3 text-sm">
        <p className="break-all">
          <b>Contract:</b> {MARKETPLACE_ADDRESS}
        </p>
        <p>
          <b>Next task id:</b> {nextTaskQuery.data?.toString() ?? "loading"}
        </p>
        <p>
          <b>Wallet:</b> {address ? short(address) : "not connected"}
        </p>
        {status ? <p className="mt-2 rounded-md bg-paper p-2 font-semibold break-words">{status}</p> : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {tasks.map(({ id, task }) => {
          const taskStatus = Number(task[5]);
          const statusName = statusNames[taskStatus] ?? `Status ${taskStatus}`;
          const employer = task[1];
          const executor = task[2];
          const owner = ownerQuery.data;
          const openToAnyWorker = taskStatus === 0 && sameAddress(executor, owner);
          const isEmployer = sameAddress(address, employer);
          const isExecutor = sameAddress(address, executor);
          const canAccept = taskStatus === 0 && (openToAnyWorker || isExecutor);
          const canCancel = taskStatus === 0 && isEmployer;
          const canProof = taskStatus === 1 && isExecutor;
          const canFinish = taskStatus === 2 && isEmployer;
          const canAutoRelease = taskStatus === 2;

          return (
            <article key={id.toString()} className="rounded-md border border-black/10 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-moss">Task #{id.toString()}</p>
                  <h2 className="mt-1 text-xl font-black">{formatUnits(task[3], 6)} USDC</h2>
                </div>
                <span className="rounded-md bg-paper px-2 py-1 text-sm font-semibold">{statusName}</span>
              </div>
              <dl className="mt-4 grid gap-2 text-sm">
                <div className="rounded-md bg-paper p-2">
                  <dt className="font-semibold">Employer</dt>
                  <dd className="break-all">{employer}</dd>
                </div>
                <div className="rounded-md bg-paper p-2">
                  <dt className="font-semibold">Executor</dt>
                  <dd className="break-all">{openToAnyWorker ? "Open to any worker" : executor}</dd>
                </div>
                <div className="rounded-md bg-paper p-2">
                  <dt className="font-semibold">Deadline</dt>
                  <dd>{new Date(Number(task[4]) * 1000).toLocaleString()}</dd>
                </div>
              </dl>
              <textarea
                className="field mt-3 min-h-20"
                value={proofs[id.toString()] ?? ""}
                onChange={(event) => setProofs((current) => ({ ...current, [id.toString()]: event.target.value }))}
                placeholder="Proof note or URL"
                disabled={!canProof}
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button className="btn btn-primary" type="button" disabled={!canAccept} onClick={() => call(id, "acceptTask", "Accepted")}>
                  <Handshake size={16} />
                  Accept as worker
                </button>
                <button className="btn btn-soft" type="button" disabled={!canProof} onClick={() => submitProof(id)}>
                  <Upload size={16} />
                  Submit proof
                </button>
                <button className="btn btn-soft" type="button" disabled={!canFinish} onClick={() => call(id, "confirmCompletion", "Completed")}>
                  <Check size={16} />
                  Confirm payout
                </button>
                <button className="btn btn-soft" type="button" disabled={!canCancel} onClick={() => call(id, "cancelOpenTask", "Refund sent")}>
                  <RotateCcw size={16} />
                  Cancel / refund
                </button>
                <button className="btn btn-soft" type="button" disabled={!canFinish} onClick={() => call(id, "openDispute", "Disputed")}>
                  <ShieldAlert size={16} />
                  Open dispute
                </button>
                <button className="btn btn-soft" type="button" disabled={!canAutoRelease} onClick={() => call(id, "autoRelease", "Auto released")}>
                  <TimerReset size={16} />
                  Auto release
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {!tasks.length ? <p className="mt-8 rounded-md bg-white p-6 text-center">No on-chain tasks in this contract yet.</p> : null}
    </section>
  );
}
