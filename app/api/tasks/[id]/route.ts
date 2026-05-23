import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return Response.json({ error: { code: "not_found", message: "task not found" } }, { status: 404 });
  return Response.json({ task });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const task = await prisma.task.update({
    where: { id },
    data: {
      status: body.status,
      chainTaskId: body.chainTaskId,
      txHash: body.txHash,
      completedAt: ["Completed", "Cancelled", "AutoReleased"].includes(body.status) ? new Date() : undefined
    }
  });
  return Response.json({ task });
}
