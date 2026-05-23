import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function requireAgent(req: NextRequest) {
  if (process.env.X402_ENABLED === "true") return null;
  const expected = process.env.MARKETPLACE_API_KEY;
  const auth = req.headers.get("authorization");
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json(
      { error: { code: "agent_auth_required", message: "Bearer token required" } },
      { status: 401 }
    );
  }
  return null;
}
