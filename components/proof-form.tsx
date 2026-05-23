"use client";

import { Upload } from "lucide-react";
import { useState } from "react";
import { useWriteContract } from "wagmi";
import { marketplaceAbi } from "@/lib/contractAbi";
import { MARKETPLACE_ADDRESS } from "@/lib/constants";

export function ProofForm({ taskId, chainTaskId }: { taskId: string; chainTaskId?: string | null }) {
  const { writeContractAsync } = useWriteContract();
  const [status, setStatus] = useState("");

  async function submit(formData: FormData) {
    setStatus("Uploading");
    const proofUrl = String(formData.get("proofUrl") ?? "");
    const res = await fetch(`/api/tasks/${taskId}/proof`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofUrl, note: formData.get("note") })
    });
    const data = await res.json();
    if (chainTaskId) {
      setStatus("Submit on-chain proof");
      await writeContractAsync({
        address: MARKETPLACE_ADDRESS,
        abi: marketplaceAbi,
        functionName: "submitProof",
        args: [BigInt(chainTaskId), data.proofHash],
        gas: 120_000n
      });
    }
    setStatus("Proof saved");
  }

  return (
    <form action={submit} className="mt-5 grid gap-3 rounded-md border border-black/10 bg-white p-4">
      <h2 className="text-xl font-black">Submit proof</h2>
      <input className="field" name="proofUrl" placeholder="Proof URL from Blob/IPFS" required />
      <textarea className="field min-h-20" name="note" placeholder="Worker note" />
      <button className="btn btn-primary" type="submit">
        <Upload size={16} />
        {status || "Save proof"}
      </button>
    </form>
  );
}
