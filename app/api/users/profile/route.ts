import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionAddress } from "@/lib/auth";
import { apiError, normalizeAddress } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const sessionAddress = await getSessionAddress();
  const body = await req.json();
  const address = normalizeAddress(body.address ?? sessionAddress ?? "");
  if (!address || (sessionAddress && address !== sessionAddress)) return apiError("wallet session required", 401);

  const user = await prisma.user.upsert({
    where: { address },
    update: {},
    create: { address }
  });

  const profile = await prisma.humanProfile.upsert({
    where: { address },
    update: {
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
    },
    create: {
      userId: user.id,
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
      avatarUrl: body.avatarUrl || null
    }
  });

  return Response.json({ profile });
}
