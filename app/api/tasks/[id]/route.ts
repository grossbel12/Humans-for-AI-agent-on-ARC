import { NextRequest } from "next/server";
import { getTask, updateTask } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) return Response.json({ error: { code: "not_found", message: "task not found" } }, { status: 404 });
  return Response.json({ task });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const task = await updateTask(id, { status: body.status, chainTaskId: body.chainTaskId, txHash: body.txHash });
  if (!task) return Response.json({ error: { code: "not_found", message: "task not found" } }, { status: 404 });
  return Response.json({ task });
}
