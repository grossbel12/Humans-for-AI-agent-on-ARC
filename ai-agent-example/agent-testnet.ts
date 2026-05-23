import "dotenv/config";

const base = process.env.MARKETPLACE_API_URL ?? "http://localhost:3000";
const key = process.env.MARKETPLACE_API_KEY ?? "dev-agent-key";

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
      ...init.headers
    }
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

const humans = await api("/api/v1/agents/humans?city=Berlin&skill=photo&limit=3");
console.log(JSON.stringify(humans, null, 2));

const first = humans.humans?.[0];
if (first) {
  const hire = await api("/api/v1/agents/hire", {
    method: "POST",
    body: JSON.stringify({
      agentId: "0x2000000000000000000000000000000000000001",
      executorAddress: first.address,
      title: "Photo storefront",
      description: "Take 3 clear photos and upload proof URL.",
      amountUsdc: "2.00",
      deadlineHours: 2,
      category: "Creative"
    })
  });
  console.log(JSON.stringify(hire, null, 2));
}
