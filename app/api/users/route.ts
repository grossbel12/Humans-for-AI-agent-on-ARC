import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const skill = url.searchParams.get("skill");
  const category = url.searchParams.get("category");
  const maxRate = url.searchParams.get("maxRate");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 24), 50);

  const humans = await prisma.humanProfile.findMany({
    where: {
      available: true,
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
      ...(skill ? { skills: { has: skill } } : {}),
      ...(category ? { categories: { has: category } } : {}),
      ...(maxRate ? { rateUsd: { lte: maxRate } } : {})
    },
    orderBy: [{ verified: "desc" }, { reputation: "desc" }, { rateUsd: "asc" }],
    take: limit
  });

  return Response.json({ humans });
}
