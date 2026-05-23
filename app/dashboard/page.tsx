import { TaskCard } from "@/components/task-card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tasks = await prisma.task.findMany({ orderBy: { createdAt: "desc" }, take: 30 }).catch(() => []);
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-black">Dashboard</h1>
      <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
      {!tasks.length ? <p className="mt-8 rounded-md bg-white p-6 text-center">No tasks yet.</p> : null}
    </section>
  );
}
