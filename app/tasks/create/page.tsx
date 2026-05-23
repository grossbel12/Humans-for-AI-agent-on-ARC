import { CreateTaskForm } from "@/components/create-task-form";

export default async function CreateTaskPage({ searchParams }: { searchParams: Promise<{ executor?: string }> }) {
  const sp = await searchParams;
  return (
    <section className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-black">Create task</h1>
      <p className="mt-1 text-black/70">Fund escrow with Arc USDC. Worker gets paid after proof.</p>
      <CreateTaskForm defaultExecutor={sp.executor ?? ""} />
    </section>
  );
}
