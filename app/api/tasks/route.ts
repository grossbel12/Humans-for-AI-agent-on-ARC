import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionAddress } from "@/lib/auth";
import { apiError, bytes32Hash, normalizeAddress, usdcToAtomic } from "@/lib/utils";
import { MARKETPLACE_ADDRESS } from "@/lib/constants";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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
  const amountAtomic = usdcToAtomic(body.amountUsdc);

  await prisma.user.upsert({ where: { address: employerAddress }, update: {}, create: { address: employerAddress } });
  await prisma.user.upsert({ where: { address: executorAddress }, update: {}, create: { address: executorAddress } });

  const task = await prisma.task.create({
    data: {
      ...metadata,
      amountAtomic,
      metadataHash,
      deadline: new Date(body.deadline),
      contractAddress: MARKETPLACE_ADDRESS
    }
  });

  return Response.json({ task, tx: { executorAddress, amountAtomic, deadlineUnix: Math.floor(new Date(body.deadline).getTime() / 1000), metadataHash } });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const address = url.searchParams.get("address")?.toLowerCase();
  const tasks = await prisma.task.findMany({
    where: address ? { OR: [{ employerAddress: address }, { executorAddress: address }] } : {},
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return Response.json({ tasks });
}
