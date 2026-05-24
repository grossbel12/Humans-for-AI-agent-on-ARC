import { NextRequest } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { createTask, listTasks } from "@/lib/store";
import { apiError, bytes32Hash, normalizeAddress, usdcToAtomic } from "@/lib/utils";
import { MARKETPLACE_ADDRESS } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const sessionAddress = await getSessionAddress();
    const body = await req.json();
    const employerAddress = normalizeAddress(body.employerAddress ?? sessionAddress ?? "");
    const executorAddress = normalizeAddress(body.executorAddress ?? "");
    if (!employerAddress || !executorAddress) return apiError("employer and executor required");

    const metadata = {
      title: body.title,
      description: body.description,
      category: body.category ?? "Other",
      location: body.location ?? "",
      employerAddress,
      executorAddress,
      amountUsdc: String(body.amountUsdc),
      deadline: body.deadline
    };
    const metadataHash = bytes32Hash(metadata);
    const taskHash = body.metadataHash ?? metadataHash;
    const amountAtomic = usdcToAtomic(body.amountUsdc);

    const task = await createTask({
      ...metadata,
      amountAtomic,
      metadataHash: taskHash,
      txHash: body.txHash,
      chainTaskId: body.chainTaskId,
      deadline: new Date(body.deadline),
      contractAddress: MARKETPLACE_ADDRESS
    });

    return Response.json({ task, tx: { executorAddress, amountAtomic, deadlineUnix: Math.floor(new Date(body.deadline).getTime() / 1000), metadataHash: taskHash } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Task save failed";
    return apiError(message, 500, "task_save_failed");
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const address = url.searchParams.get("address")?.toLowerCase();
    const tasks = await listTasks({ address, limit: 50 });
    return Response.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Task list unavailable";
    return Response.json({ tasks: [], error: { code: "task_list_unavailable", message } }, { status: 200 });
  }
}
