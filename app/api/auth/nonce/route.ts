import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { setNonce } from "@/lib/store";
import { normalizeAddress } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { address } = await req.json();
  if (!address) {
    return Response.json({ error: { code: "address_required", message: "address required" } }, { status: 400 });
  }
  const nonce = randomBytes(16).toString("hex");
  const normalized = normalizeAddress(address);
  await setNonce(normalized, nonce);
  (await cookies()).set("rah_nonce", nonce, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  return Response.json({ nonce });
}
