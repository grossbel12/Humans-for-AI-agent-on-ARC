import { withX402 } from "@x402/next";
import { NextRequest, NextResponse } from "next/server";
import { requireAgent } from "@/lib/agent-auth";
import { getX402Server, x402PaymentTo } from "@/lib/x402";

export const runtime = "nodejs";

const workerPayTo = process.env.X402_WORKER_PAY_TO ?? process.env.MARKETPLACE_WALLET_ADDRESS ?? "";
const workPrice = process.env.X402_WORK_PRICE ?? "$1.00";

async function handler(req: NextRequest): Promise<NextResponse> {
  const auth = requireAgent(req);
  if (auth) return auth;
  const body = await req.json().catch(() => ({}));
  const requestedWorker = String(body.workerAddress ?? workerPayTo);
  if (workerPayTo && requestedWorker.toLowerCase() !== workerPayTo.toLowerCase()) {
    return NextResponse.json(
      {
        error: {
          code: "worker_payto_mismatch",
          message: "This x402 work payment endpoint is configured for a fixed worker payTo address."
        },
        configuredWorker: workerPayTo
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    workPayment: {
      type: "x402-direct-worker-payment",
      workerAddress: workerPayTo || requestedWorker,
      price: workPrice,
      taskId: body.taskId ?? null,
      title: body.title ?? "Direct x402 work payment",
      proofUrl: body.proofUrl ?? null,
      note: body.note ?? null
    },
    note:
      "This endpoint represents direct x402 payment for completed work. It is best for instant/micro tasks. Escrow remains the safer flow for larger or dispute-prone tasks."
  });
}

export const POST =
  process.env.X402_ENABLED === "true" && process.env.X402_DIRECT_WORK_PAYMENT === "true"
    ? withX402(handler, x402PaymentTo(workPrice, "Direct RentAHuman x402 work payment", workerPayTo), getX402Server())
    : handler;
