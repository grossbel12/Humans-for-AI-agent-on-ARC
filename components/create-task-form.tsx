"use client";

import { Coins, Send } from "lucide-react";
import { useState } from "react";
import { isAddress, parseEventLogs, parseUnits } from "viem";
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { erc20Abi, marketplaceAbi } from "@/lib/contractAbi";
import { ARC_CHAIN_ID, MARKETPLACE_ADDRESS, USDC_ADDRESS } from "@/lib/constants";
import { ensureArcTestnet } from "@/lib/arc-wallet";

async function metadataHash(input: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return `0x${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
}

export function CreateTaskForm({ defaultExecutor }: { defaultExecutor: string }) {
  const { address } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [status, setStatus] = useState("");
  useWaitForTransactionReceipt({ hash });

  async function submit(formData: FormData) {
    try {
      if (!address) {
        setStatus("Connect wallet first");
        return;
      }
      const amount = String(formData.get("amountUsdc"));
      const deadlineInput = String(formData.get("deadline"));
      const deadlineDate = new Date(deadlineInput);
      if (!amount || Number(amount) <= 0) {
        setStatus("Enter USDC amount");
        return;
      }
      if (Number.isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= Date.now()) {
        setStatus("Choose future deadline");
        return;
      }
      if (MARKETPLACE_ADDRESS === "0x0000000000000000000000000000000000000000") {
        setStatus("Missing contract address");
        return;
      }
      const deadline = deadlineDate.toISOString();
      const executorAddress = String(formData.get("executorAddress"));
      if (!isAddress(executorAddress)) {
        setStatus("Invalid executor address");
        return;
      }
      const body = {
        employerAddress: address,
        executorAddress,
        title: formData.get("title"),
        description: formData.get("description"),
        category: formData.get("category"),
        location: formData.get("location"),
        amountUsdc: amount,
        deadline
      };
      const taskHash = await metadataHash(body);
      const amountAtomic = parseUnits(amount, 6);
      const deadlineUnix = Math.floor(deadlineDate.getTime() / 1000);
      setStatus("Switch to Arc Testnet");
      if (chainId !== ARC_CHAIN_ID) {
        try {
          await switchChainAsync({ chainId: ARC_CHAIN_ID });
        } catch {
          // MetaMask sometimes needs the direct EIP-3326/EIP-3085 path.
        }
      }
      await ensureArcTestnet();
      setStatus("Approve USDC");
      const approveHash = await writeContractAsync({
        chainId: ARC_CHAIN_ID,
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [MARKETPLACE_ADDRESS, amountAtomic],
        gas: 70_000n
      });
      setStatus("Wait approve");
      const approveReceipt = await publicClient?.waitForTransactionReceipt({ hash: approveHash });
      if (approveReceipt?.status === "reverted") {
        setStatus("Approve reverted");
        return;
      }
      setStatus("Create escrow");
      const txHash = await writeContractAsync({
        chainId: ARC_CHAIN_ID,
        address: MARKETPLACE_ADDRESS,
        abi: marketplaceAbi,
        functionName: "createTask",
        args: [executorAddress as `0x${string}`, amountAtomic, BigInt(deadlineUnix), taskHash],
        gas: 350_000n
      });
      setHash(txHash);
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: txHash });
      const logs = receipt
        ? parseEventLogs({ abi: marketplaceAbi, logs: receipt.logs, eventName: "TaskCreated" })
        : [];
      const chainTaskId = logs[0]?.args.taskId?.toString();
      setStatus("Save task");
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, metadataHash: taskHash, txHash, chainTaskId })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setStatus(data?.error?.message ? `Escrow created, DB: ${data.error.message}` : `Escrow created, DB save failed (${res.status})`);
        return;
      }
      setStatus("Escrow created");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Escrow failed";
      setStatus(message);
    }
  }

  return (
    <form action={submit} className="mt-5 grid gap-3 rounded-md border border-black/10 bg-white p-4">
      <input className="field" name="executorAddress" placeholder="Executor 0x..." defaultValue={defaultExecutor} required />
      <input className="field" name="title" placeholder="Task title" required />
      <textarea className="field min-h-28" name="description" placeholder="Exact instructions and proof needed" required />
      <div className="grid gap-3 md:grid-cols-2">
        <input className="field" name="category" placeholder="Category" required />
        <input className="field" name="location" placeholder="Location or Remote" />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="relative">
          <Coins className="pointer-events-none absolute left-3 top-2.5" size={16} />
          <input className="field pl-9" name="amountUsdc" type="number" min="1" step="0.000001" placeholder="USDC" required />
        </label>
        <input className="field" name="deadline" type="datetime-local" required />
      </div>
      <button className="btn btn-primary" type="submit" disabled={!address}>
        <Send size={16} />
        {status || "Fund escrow"}
      </button>
    </form>
  );
}
