import { NextRequest } from "next/server";
import { listHumans } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city");
  const skill = url.searchParams.get("skill");
  const category = url.searchParams.get("category");
  const maxRate = url.searchParams.get("maxRate");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 24), 50);

  const humans = await listHumans({ city, skill, category, maxRate, limit });

  return Response.json({ humans });
}
