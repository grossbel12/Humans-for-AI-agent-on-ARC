import { notFound } from "next/navigation";
import { ProofForm } from "@/components/proof-form";
import { TaskActions } from "@/components/task-actions";
import { getTask } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = await getTask(id);
  if (!task) notFound();
  return (
    <section className="mx-auto max-w-4xl px-4 py-6">
      <div className="rounded-md border border-black/10 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase text-moss">{task.category}</p>
            <h1 className="text-3xl font-black">{task.title}</h1>
          </div>
          <span className="rounded-md bg-paper px-2 py-1 text-sm font-semibold">{task.status}</span>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-black/80">{task.description}</p>
        <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-md bg-paper p-3">
            <dt className="font-semibold">Amount</dt>
            <dd>{String(task.amountUsdc)} USDC</dd>
          </div>
          <div className="rounded-md bg-paper p-3">
            <dt className="font-semibold">Deadline</dt>
            <dd>{new Date(task.deadline).toLocaleString()}</dd>
          </div>
          <div className="rounded-md bg-paper p-3">
            <dt className="font-semibold">Executor</dt>
            <dd className="break-all">{task.executorAddress}</dd>
          </div>
          <div className="rounded-md bg-paper p-3">
            <dt className="font-semibold">Escrow tx</dt>
            <dd className="break-all">{task.txHash ?? "pending"}</dd>
          </div>
        </dl>
      </div>
      <TaskActions taskId={task.id} chainTaskId={task.chainTaskId} status={task.status} />
      <ProofForm taskId={task.id} chainTaskId={task.chainTaskId} />
      {task.proofUrl ? (
        <a className="mt-4 block rounded-md border border-black/10 bg-white p-4 font-semibold" href={task.proofUrl}>
          Open submitted proof
        </a>
      ) : null}
    </section>
  );
}
