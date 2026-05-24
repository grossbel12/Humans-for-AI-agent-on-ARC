import { withX402 } from "@x402/next";
import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";
import { getTask } from "@/lib/store";
import { getX402Server, x402Payment } from "@/lib/x402";

export const runtime = "nodejs";

async function handler(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const auth = requireAgent(req);
  if (auth) return auth;
  const { id } = await params;
  const task = await getTask(id);
  if (!task) return NextResponse.json({ error: { code: "not_found", message: "task not found" } }, { status: 404 });
  return NextResponse.json({ proofUrl: task.proofUrl, proofHash: task.proofHash, status: task.status });
}

export const GET =
  process.env.X402_ENABLED === "true"
    ? (withX402(handler as never, x402Payment("$0.005", "Retrieve RentAHuman proof"), getX402Server()) as never)
    : handler;
