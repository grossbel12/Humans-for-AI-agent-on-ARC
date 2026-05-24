import { getHuman } from "@/lib/store";
import { normalizeAddress } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const profile = await getHuman(normalizeAddress(address));
  if (!profile) return Response.json({ error: { code: "not_found", message: "profile not found" } }, { status: 404 });
  return Response.json({ profile });
}
