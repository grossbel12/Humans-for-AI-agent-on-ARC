import { withX402 } from "@x402/next";
import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";
import { listHumans } from "@/lib/store";
import { getX402Server, x402Payment } from "@/lib/x402";

export const runtime = "nodejs";

async function handler(req: NextRequest): Promise<NextResponse> {
  const auth = requireAgent(req);
  if (auth) return auth;
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const skill = url.searchParams.get("skill");
  const maxRate = url.searchParams.get("maxRate");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 8), 25);
  const humans = await listHumans({ city, skill, maxRate, limit });
  return NextResponse.json({ humans });
}

export const GET =
  process.env.X402_ENABLED === "true"
    ? withX402(handler, x402Payment("$0.01", "Search RentAHuman workers"), getX402Server())
    : handler;
