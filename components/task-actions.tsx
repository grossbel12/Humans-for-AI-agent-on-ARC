"use client";

import { Check, Handshake, RotateCcw, TimerReset, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWriteContract } from "wagmi";
import { marketplaceAbi } from "@/lib/contractAbi";
import { MARKETPLACE_ADDRESS } from "@/lib/constants";

type ActionName = "acceptTask" | "confirmCompletion" | "openDispute" | "cancelOpenTask" | "autoRelease";

export function TaskActions({ taskId, chainTaskId, status: taskStatus }: { taskId: string; chainTaskId?: string | null; status: string }) {
  const router = useRouter();
  const { writeContractAsync } = useWriteContract();
  const [manualId, setManualId] = useState(chainTaskId ?? "");
  const [status, setStatus] = useState("");

  async function call(name: ActionName, nextStatus: string) {
    try {
      const id = manualId.trim();
      if (!id) return setStatus("Need chain task id");
      setStatus("Wallet tx");
      const txHash = await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: marketplaceAbi,
        functionName: name,
        args: [BigInt(id)],
        gas: 180_000n
      });
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, txHash, chainTaskId: id })
      });
      if (!res.ok) {
        setStatus("On-chain done, local save failed");
        return;
      }
      setStatus(nextStatus);
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Transaction failed");
    }
  }

  return (
    <div className="mt-5 grid gap-3 rounded-md border border-black/10 bg-white p-4">
      <h2 className="text-xl font-black">On-chain actions</h2>
      <input className="field" value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="Chain task id" />
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-soft" type="button" onClick={() => call("acceptTask", "InProgress")}>
          <Handshake size={16} />
          Accept
        </button>
        <button className="btn btn-primary" type="button" onClick={() => call("confirmCompletion", "Completed")}>
          <Check size={16} />
          Confirm
        </button>
        <button className="btn btn-soft" type="button" onClick={() => call("openDispute", "Disputed")}>
          <TriangleAlert size={16} />
          Dispute
        </button>
        <button className="btn btn-soft" type="button" onClick={() => call("cancelOpenTask", "Cancelled")} disabled={taskStatus !== "Open"}>
          <RotateCcw size={16} />
          Cancel / refund
        </button>
        <button className="btn btn-soft" type="button" onClick={() => call("autoRelease", "AutoReleased")} disabled={taskStatus !== "ProofSubmitted"}>
          <TimerReset size={16} />
          Auto release
        </button>
      </div>
      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </div>
  );
}
