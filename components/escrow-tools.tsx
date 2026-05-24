"use client";

import { Check, Handshake, RotateCcw, ShieldAlert, TimerReset, Upload } from "lucide-react";
import { useState } from "react";
import { keccak256, stringToHex } from "viem";
import { useWriteContract } from "wagmi";
import { marketplaceAbi } from "@/lib/contractAbi";
import { MARKETPLACE_ADDRESS } from "@/lib/constants";

type ActionName = "acceptTask" | "confirmCompletion" | "openDispute" | "cancelOpenTask" | "autoRelease";

export function EscrowTools() {
  const { writeContractAsync } = useWriteContract();
  const [taskId, setTaskId] = useState("");
  const [proof, setProof] = useState("");
  const [status, setStatus] = useState("");

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
          <textarea className="field min-h-24" value={proof} onChange={(e) => setProof(e.target.value)} placeholder="Proof note or URL" />
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="btn btn-primary" type="button" onClick={() => call("cancelOpenTask", "Refund sent")}>
              <RotateCcw size={16} />
              Cancel / refund
            </button>
            <button className="btn btn-soft" type="button" onClick={() => call("acceptTask", "Accepted")}>
              <Handshake size={16} />
              Accept
            </button>
            <button className="btn btn-soft" type="button" onClick={submitProof}>
              <Upload size={16} />
              Submit proof
            </button>
            <button className="btn btn-soft" type="button" onClick={() => call("confirmCompletion", "Completed")}>
              <Check size={16} />
              Confirm completion
            </button>
            <button className="btn btn-soft" type="button" onClick={() => call("openDispute", "Disputed")}>
              <ShieldAlert size={16} />
              Open dispute
            </button>
            <button className="btn btn-soft" type="button" onClick={() => call("autoRelease", "Auto released")}>
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
