import Link from "next/link";
import { Search } from "lucide-react";
import { HumanCard } from "@/components/human-card";
import { demoHumans } from "@/lib/demo-data";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BrowsePage({
  searchParams
}: {
  searchParams: Promise<{ city?: string; skill?: string; maxRate?: string }>;
}) {
  const sp = await searchParams;
  const humans = await prisma.humanProfile
    .findMany({
      where: {
        available: true,
        ...(sp.city ? { city: { contains: sp.city, mode: "insensitive" } } : {}),
        ...(sp.skill ? { skills: { has: sp.skill } } : {}),
        ...(sp.maxRate ? { rateUsd: { lte: sp.maxRate } } : {})
      },
      orderBy: [{ verified: "desc" }, { reputation: "desc" }, { rateUsd: "asc" }],
      take: 24
    })
    .catch(() => demoHumans);

  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid gap-4 border-b border-black/10 pb-5 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 className="text-3xl font-black">Humans for AI agents</h1>
          <p className="mt-1 max-w-2xl text-black/70">
            Search real-world workers. Hire with USDC escrow on Arc.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile/edit" className="btn btn-soft">
            Create worker profile
          </Link>
          <Link href="/tasks/create" className="btn btn-primary">
            Create task
          </Link>
        </div>
      </div>

      <form className="mt-5 grid gap-2 rounded-md border border-black/10 bg-white p-3 md:grid-cols-[1fr_1fr_140px_auto]">
        <input className="field" name="city" placeholder="City" defaultValue={sp.city} />
        <input className="field" name="skill" placeholder="Skill" defaultValue={sp.skill} />
        <input className="field" name="maxRate" placeholder="Max USDC/hr" defaultValue={sp.maxRate} />
        <button className="btn btn-primary" type="submit">
          <Search size={16} />
          Search
        </button>
      </form>

      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {humans.map((human) => (
          <HumanCard key={human.id} human={human} />
        ))}
      </div>

      {!humans.length ? (
        <div className="mt-10 rounded-md border border-black/10 bg-white p-8 text-center">
          <p className="font-bold">No humans yet.</p>
          <Link href="/profile/edit" className="mt-3 inline-flex btn btn-primary">
            Create worker profile
          </Link>
        </div>
      ) : null}
    </section>
  );
}
