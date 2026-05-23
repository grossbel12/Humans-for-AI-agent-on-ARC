import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, BriefcaseBusiness, MapPin } from "lucide-react";
import { demoHumans } from "@/lib/demo-data";
import { prisma } from "@/lib/db";
import { normalizeAddress } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  const profile = await prisma.humanProfile
    .findUnique({ where: { address: normalizeAddress(address) } })
    .catch(() => demoHumans.find((human) => human.address.toLowerCase() === normalizeAddress(address)) ?? null);
  if (!profile) notFound();

  return (
    <section className="mx-auto max-w-4xl px-4 py-6">
      <div className="rounded-md border border-black/10 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="grid h-20 w-20 place-items-center rounded-md bg-moss text-3xl font-black text-white">
            {profile.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-black">{profile.name}</h1>
              {profile.verified ? <BadgeCheck className="text-moss" /> : null}
            </div>
            <p className="mt-1 text-lg text-black/75">{profile.headline}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-md bg-paper px-2 py-1">
                <MapPin size={15} />
                {profile.remote ? "Remote" : `${profile.city}, ${profile.country}`}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-paper px-2 py-1">
                <BriefcaseBusiness size={15} />
                {profile.jobsDone} jobs
              </span>
              <span className="rounded-md bg-paper px-2 py-1">{String(profile.rateUsd)} USDC/hr</span>
              <span className="rounded-md bg-paper px-2 py-1">{profile.reputation} rep</span>
            </div>
          </div>
          <Link href={`/tasks/create?executor=${profile.address}`} className="btn btn-primary">
            Hire
          </Link>
        </div>

        <p className="mt-6 whitespace-pre-wrap text-black/80">{profile.bio}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <span key={skill} className="rounded-md border border-black/10 px-2 py-1 text-sm">
              {skill}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
