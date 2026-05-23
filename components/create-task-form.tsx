"use client";

import { Coins, Send } from "lucide-react";
import { useState } from "react";
import { parseEventLogs, parseUnits } from "viem";
import { useAccount, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { erc20Abi, marketplaceAbi } from "@/lib/contractAbi";
import { MARKETPLACE_ADDRESS, USDC_ADDRESS } from "@/lib/constants";

export function CreateTaskForm({ defaultExecutor }: { defaultExecutor: string }) {
  const { address } = useAccount();
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
      setStatus("Creating DB task");
      const deadline = deadlineDate.toISOString();
    const body = {
      employerAddress: address,
      executorAddress: formData.get("executorAddress"),
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      location: formData.get("location"),
      amountUsdc: amount,
      deadline
    };
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setStatus(data?.error?.message ?? `Task API failed (${res.status})`);
        return;
      }
      const amountAtomic = parseUnits(amount, 6);
      setStatus("Approve USDC");
      await writeContractAsync({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [MARKETPLACE_ADDRESS, amountAtomic],
        gas: 70_000n
      });
      setStatus("Create escrow");
      const txHash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: marketplaceAbi,
        functionName: "createTask",
        args: [data.tx.executorAddress, amountAtomic, BigInt(data.tx.deadlineUnix), data.tx.metadataHash],
        gas: 350_000n
      });
      setHash(txHash);
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: txHash });
      const logs = receipt
        ? parseEventLogs({ abi: marketplaceAbi, logs: receipt.logs, eventName: "TaskCreated" })
        : [];
      const chainTaskId = logs[0]?.args.taskId?.toString();
      await fetch(`/api/tasks/${data.task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Open", txHash, chainTaskId })
      });
      setStatus("Escrow tx sent");
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
