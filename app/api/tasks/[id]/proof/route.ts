import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { bytes32Hash } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const proofHash = bytes32Hash({ proofUrl: body.proofUrl, note: body.note, at: new Date().toISOString() });
  const task = await prisma.task.update({
    where: { id },
    data: { proofUrl: body.proofUrl, proofHash, status: "ProofSubmitted" }
  });
  return Response.json({ task, proofHash });
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return Response.json({ error: { code: "not_found", message: "task not found" } }, { status: 404 });
  return Response.json({ proofUrl: task.proofUrl, proofHash: task.proofHash, status: task.status });
}
