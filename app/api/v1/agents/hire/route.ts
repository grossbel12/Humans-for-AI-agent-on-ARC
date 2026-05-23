import { withX402 } from "@x402/next";
import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";
import { MARKETPLACE_ADDRESS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { getX402Server, x402Payment } from "@/lib/x402";
import { bytes32Hash, normalizeAddress, usdcToAtomic } from "@/lib/utils";

export const runtime = "nodejs";

async function handler(req: NextRequest): Promise<NextResponse> {
  const auth = requireAgent(req);
  if (auth) return auth;
  const body = await req.json();
  const employerAddress = normalizeAddress(body.agentId ?? body.employerAddress ?? "");
  const executorAddress = normalizeAddress(body.executorAddress ?? "");
  if (!employerAddress || !executorAddress) {
    return NextResponse.json({ error: { code: "bad_request", message: "agentId and executorAddress required" } }, { status: 400 });
  }
  await prisma.user.upsert({ where: { address: employerAddress }, update: {}, create: { address: employerAddress } });
  await prisma.user.upsert({ where: { address: executorAddress }, update: {}, create: { address: executorAddress } });
  const deadline = new Date(Date.now() + Math.max(Number(body.deadlineHours ?? 1), 1) * 60 * 60 * 1000);
  const metadata = {
    title: body.title,
    description: body.description,
    category: body.category ?? "Other",
    employerAddress,
    executorAddress,
    amountUsdc: String(body.amountUsdc ?? body.amount),
    deadline: deadline.toISOString()
  };
  const task = await prisma.task.create({
    data: {
      ...metadata,
      agentId: employerAddress,
      amountAtomic: usdcToAtomic(metadata.amountUsdc),
      metadataHash: bytes32Hash(metadata),
      contractAddress: MARKETPLACE_ADDRESS
    }
  });
  return NextResponse.json({
    task,
    escrow: {
      contractAddress: MARKETPLACE_ADDRESS,
      executorAddress,
      amountAtomic: task.amountAtomic,
      deadlineUnix: Math.floor(deadline.getTime() / 1000),
      metadataHash: task.metadataHash
    }
  });
}

export const POST =
  process.env.X402_ENABLED === "true"
    ? withX402(handler, x402Payment("$0.05", "Create RentAHuman hire request"), getX402Server())
    : handler;
