"use client";

import { Check, Handshake, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useWriteContract } from "wagmi";
import { marketplaceAbi } from "@/lib/contractAbi";
import { MARKETPLACE_ADDRESS } from "@/lib/constants";

export function TaskActions({ taskId, chainTaskId }: { taskId: string; chainTaskId?: string | null }) {
  const { writeContractAsync } = useWriteContract();
  const [manualId, setManualId] = useState(chainTaskId ?? "");
  const [status, setStatus] = useState("");

  async function call(name: "acceptTask" | "confirmCompletion" | "openDispute", nextStatus: string) {
    const id = manualId.trim();
    if (!id) return setStatus("Need chain task id");
    setStatus("Wallet tx");
    const txHash = await writeContractAsync({
      address: MARKETPLACE_ADDRESS,
      abi: marketplaceAbi,
      functionName: name,
      args: [BigInt(id)],
      gas: 160_000n
    });
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus, txHash, chainTaskId: id })
    });
    setStatus(nextStatus);
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
      </div>
      {status ? <p className="text-sm text-black/70">{status}</p> : null}
    </div>
  );
}
