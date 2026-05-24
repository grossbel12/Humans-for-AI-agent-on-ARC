import { NextRequest } from "next/server";
import { getSessionAddress } from "@/lib/auth";
import { upsertHuman } from "@/lib/store";
import { apiError, normalizeAddress } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sessionAddress = await getSessionAddress();
  const body = await req.json();
  const address = normalizeAddress(body.address ?? sessionAddress ?? "");
  if (!address || (sessionAddress && address !== sessionAddress)) return apiError("wallet session required", 401);

  const profile = await upsertHuman({
    address,
    name: body.name,
    headline: body.headline,
    bio: body.bio,
    city: body.city,
    country: body.country,
    remote: Boolean(body.remote),
    skills: body.skills ?? [],
    categories: body.categories ?? [],
    rateUsd: String(body.rateUsd ?? "0"),
    available: body.available ?? true,
    avatarUrl: body.avatarUrl || null
  });

  return Response.json({ profile });
}
