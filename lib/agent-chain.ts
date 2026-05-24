import { createPublicClient, http } from "viem";
import { marketplaceAbi } from "@/lib/contractAbi";
import { ARC_RPC_URL, MARKETPLACE_ADDRESS } from "@/lib/constants";

const statusNames = ["Open", "InProgress", "ProofSubmitted", "Completed", "Disputed", "Cancelled", "AutoReleased"] as const;

export async function getOnchainTaskProof(chainTaskId: string) {
  if (!/^\d+$/.test(chainTaskId)) return null;
  const client = createPublicClient({ transport: http(ARC_RPC_URL) });
  const task = await client.readContract({
    address: MARKETPLACE_ADDRESS,
    abi: marketplaceAbi,
    functionName: "tasks",
    args: [BigInt(chainTaskId)]
  });

  return {
    chainTaskId,
    proofHash: task[7] === `0x${"0".repeat(64)}` ? null : task[7],
    status: statusNames[Number(task[5])] ?? `Status ${Number(task[5])}`,
    statusCode: Number(task[5]),
    employerAddress: task[1],
    executorAddress: task[2]
  };
}
