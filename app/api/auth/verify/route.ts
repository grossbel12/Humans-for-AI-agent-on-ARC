import { SiweMessage } from "siwe";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { consumeNonce } from "@/lib/store";
import { normalizeAddress } from "@/lib/utils";
import { setSessionCookie, signSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { message, signature } = await req.json();
  const cookieNonce = (await cookies()).get("rah_nonce")?.value;
  if (!message || !signature || !cookieNonce) {
    return Response.json({ error: { code: "siwe_required", message: "message, signature, nonce required" } }, { status: 400 });
  }

  const siwe = new SiweMessage(message);
  const result = await siwe.verify({ signature, nonce: cookieNonce });
  const address = normalizeAddress(result.data.address);
  const ok = await consumeNonce(address, cookieNonce);
  if (!ok) {
    return Response.json({ error: { code: "nonce_invalid", message: "nonce invalid" } }, { status: 401 });
  }

  const token = await signSession(address);
  await setSessionCookie(token);
  return Response.json({ address });
}
