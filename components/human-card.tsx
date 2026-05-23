import Link from "next/link";
import { BadgeCheck, MapPin, Radio } from "lucide-react";

type Human = {
  address: string;
  name: string;
  headline: string;
  city: string;
  country: string;
  remote: boolean;
  skills: string[];
  rateUsd: unknown;
  reputation: number;
  jobsDone: number;
  verified: boolean;
};

export function HumanCard({ human }: { human: Human }) {
  return (
    <Link href={`/profile/${human.address}`} className="block rounded-md border border-black/10 bg-white p-4 hover:border-moss">
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-moss text-lg font-black text-white">
          {human.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 font-bold">
            <span className="truncate">{human.name}</span>
            {human.verified ? <BadgeCheck size={16} className="text-moss" /> : null}
          </div>
          <p className="line-clamp-2 text-sm text-black/70">{human.headline}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="inline-flex items-center gap-1 rounded-md bg-paper px-2 py-1">
          {human.remote ? <Radio size={13} /> : <MapPin size={13} />}
          {human.remote ? "Remote" : `${human.city}, ${human.country}`}
        </span>
        <span className="rounded-md bg-paper px-2 py-1">{String(human.rateUsd)} USDC/hr</span>
        <span className="rounded-md bg-paper px-2 py-1">{human.reputation} rep</span>
        <span className="rounded-md bg-paper px-2 py-1">{human.jobsDone} jobs</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {human.skills.slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-md border border-black/10 px-2 py-1 text-xs">
            {skill}
          </span>
        ))}
      </div>
    </Link>
  );
}
