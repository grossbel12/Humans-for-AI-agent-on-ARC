import Link from "next/link";
import { Clock, Coins } from "lucide-react";

type Task = {
  id: string;
  title: string;
  category: string;
  status: string;
  amountUsdc: unknown;
  deadline: Date;
  executorAddress: string;
};

export function TaskCard({ task }: { task: Task }) {
  return (
    <Link href={`/tasks/${task.id}`} className="block rounded-md border border-black/10 bg-white p-4 hover:border-moss">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-moss">{task.category}</p>
          <h3 className="mt-1 font-bold">{task.title}</h3>
        </div>
        <span className="rounded-md bg-paper px-2 py-1 text-xs font-semibold">{task.status}</span>
      </div>
      <div className="mt-3 grid gap-2 text-sm text-black/70">
        <span className="inline-flex items-center gap-2">
          <Coins size={15} />
          {String(task.amountUsdc)} USDC
        </span>
        <span className="inline-flex items-center gap-2">
          <Clock size={15} />
          {new Date(task.deadline).toLocaleString()}
        </span>
      </div>
    </Link>
  );
}
