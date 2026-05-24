"use client";

import { Check, Handshake, RotateCcw, ShieldAlert, TimerReset, Upload } from "lucide-react";
import { useState } from "react";
import { formatUnits, keccak256, stringToHex } from "viem";
import { useReadContract, useWriteContract } from "wagmi";
import { marketplaceAbi } from "@/lib/contractAbi";
import { MARKETPLACE_ADDRESS } from "@/lib/constants";

type ActionName = "acceptTask" | "confirmCompletion" | "openDispute" | "cancelOpenTask" | "autoRelease";
const statusNames = ["Open", "InProgress", "ProofSubmitted", "Completed", "Disputed", "Cancelled", "AutoReleased"] as const;

export function EscrowTools() {
  const { writeContractAsync } = useWriteContract();
  const [taskId, setTaskId] = useState("");
  const [proof, setProof] = useState("");
  const [status, setStatus] = useState("");
  const id = taskId.trim();
  const parsedId = id && /^\d+$/.test(id) ? BigInt(id) : undefined;
  const taskQuery = useReadContract({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: "tasks",
    args: parsedId ? [parsedId] : undefined,
    query: { enabled: Boolean(parsedId), refetchInterval: 4_000 }
  });
  const task = taskQuery.data;
  const taskStatus = task ? Number(task[5]) : undefined;
  const taskStatusName = taskStatus === undefined ? "Unknown" : statusNames[taskStatus] ?? `Status ${taskStatus}`;
  const canCancel = taskStatus === 0;
  const canAccept = taskStatus === 0;
  const canProof = taskStatus === 1;
  const canFinish = taskStatus === 2;

  async function call(name: ActionName, label: string) {
    try {
      const id = taskId.trim();
      if (!id) return setStatus("Enter chain task id");
      setStatus("Wallet tx");
      const txHash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: marketplaceAbi,
        functionName: name,
        args: [BigInt(id)],
        gas: 180_000n
      });
      setStatus(`${label}: ${txHash.slice(0, 10)}...`);
      await taskQuery.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Transaction failed");
    }
  }

  async function submitProof() {
    try {
      const id = taskId.trim();
      if (!id) return setStatus("Enter chain task id");
      const proofHash = keccak256(stringToHex(proof || `proof:${id}:${Date.now()}`));
      setStatus("Wallet tx");
      const txHash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: marketplaceAbi,
        functionName: "submitProof",
        args: [BigInt(id), proofHash],
        gas: 140_000n
      });
      setStatus(`Proof submitted: ${txHash.slice(0, 10)}...`);
      await taskQuery.refetch();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Transaction failed");
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-6">
      <div className="rounded-md border border-black/10 bg-white p-5">
        <h1 className="text-3xl font-black">Escrow tools</h1>
        <p className="mt-1 text-black/70">Manual on-chain actions for Arc escrow tasks.</p>
        <div className="mt-5 grid gap-3">
          <input className="field" value={taskId} onChange={(e) => setTaskId(e.target.value)} placeholder="Chain task id, example: 1" />
          {task ? (
            <div className="grid gap-2 rounded-md bg-paper p-3 text-sm md:grid-cols-2">
              <span>
                <b>Status:</b> {taskStatusName}
              </span>
              <span>
                <b>Amount:</b> {formatUnits(task[3], 6)} USDC
              </span>
              <span className="break-all">
                <b>Employer:</b> {task[1]}
              </span>
              <span className="break-all">
                <b>Executor:</b> {task[2]}
              </span>
            </div>
          ) : parsedId ? (
            <p className="rounded-md bg-paper p-3 text-sm">Loading on-chain task...</p>
          ) : null}
          <textarea className="field min-h-24" value={proof} onChange={(e) => setProof(e.target.value)} placeholder="Proof note or URL" />
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="btn btn-primary" type="button" onClick={() => call("cancelOpenTask", "Refund sent")} disabled={!canCancel}>
              <RotateCcw size={16} />
              Cancel / refund
            </button>
            <button className="btn btn-soft" type="button" onClick={() => call("acceptTask", "Accepted")} disabled={!canAccept}>
              <Handshake size={16} />
              Accept
            </button>
            <button className="btn btn-soft" type="button" onClick={submitProof} disabled={!canProof}>
              <Upload size={16} />
              Submit proof
            </button>
            <button className="btn btn-soft" type="button" onClick={() => call("confirmCompletion", "Completed")} disabled={!canFinish}>
              <Check size={16} />
              Confirm completion
            </button>
            <button className="btn btn-soft" type="button" onClick={() => call("openDispute", "Disputed")} disabled={!canFinish}>
              <ShieldAlert size={16} />
              Open dispute
            </button>
            <button className="btn btn-soft" type="button" onClick={() => call("autoRelease", "Auto released")} disabled={!canFinish}>
              <TimerReset size={16} />
              Auto release
            </button>
          </div>
          {status ? <p className="rounded-md bg-paper p-3 text-sm font-semibold break-words">{status}</p> : null}
        </div>
      </div>
    </section>
  );
}
