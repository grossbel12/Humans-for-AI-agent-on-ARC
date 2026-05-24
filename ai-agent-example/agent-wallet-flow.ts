import "dotenv/config";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { createPublicClient, createWalletClient, http, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const arcTestnet = {
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network"] } }
} as const;

const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ type: "bool" }]
  }
] as const;

const marketplaceAbi = [
  {
    type: "event",
    name: "TaskCreated",
    inputs: [
      { name: "taskId", type: "uint256", indexed: true },
      { name: "employer", type: "address", indexed: true },
      { name: "executor", type: "address", indexed: true },
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "taskHash", type: "bytes32" }
    ]
  },
  {
    type: "function",
    name: "createTask",
    stateMutability: "nonpayable",
    inputs: [
      { name: "executor", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "taskHash", type: "bytes32" }
    ],
    outputs: [{ type: "uint256" }]
  },
  {
    type: "function",
    name: "confirmCompletion",
    stateMutability: "nonpayable",
    inputs: [{ name: "taskId", type: "uint256" }],
    outputs: []
  }
] as const;

const base = process.env.MARKETPLACE_API_URL ?? "http://localhost:3000";
const apiKey = process.env.MARKETPLACE_API_KEY ?? "dev-agent-key";
const privateKey = process.env.AGENT_PRIVATE_KEY ?? process.env.EVM_PRIVATE_KEY;
const usdcAddress = (process.env.NEXT_PUBLIC_USDC_ADDRESS ?? "0x3600000000000000000000000000000000000000") as `0x${string}`;

if (!privateKey) throw new Error("AGENT_PRIVATE_KEY missing");

const account = privateKeyToAccount(privateKey as `0x${string}`);
const publicClient = createPublicClient({ chain: arcTestnet, transport: http(arcTestnet.rpcUrls.default.http[0]) });
const walletClient = createWalletClient({ account, chain: arcTestnet, transport: http(arcTestnet.rpcUrls.default.http[0]) });

function makeFetch() {
  if (process.env.X402_ENABLED === "true") {
    const client = new x402Client();
    client.register("eip155:*", new ExactEvmScheme(account));
    return wrapFetchWithPayment(fetch, client);
  }
  return (input: RequestInfo | URL, init: RequestInit = {}) =>
    fetch(input, {
      ...init,
      headers: {
        authorization: `Bearer ${apiKey}`,
        ...init.headers
      }
    });
}

const agentFetch = makeFetch();

async function api(path: string, init: RequestInit = {}) {
  const res = await agentFetch(`${base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init.headers
    }
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("agent", account.address);

  const humans = await api("/api/v1/agents/humans?limit=3");
  console.log("humans", JSON.stringify(humans, null, 2));

  const executorAddress =
    process.env.EXECUTOR_ADDRESS ??
    humans.humans?.[0]?.address ??
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  if (!executorAddress) throw new Error("EXECUTOR_ADDRESS missing and no humans returned");

  const hire = await api("/api/v1/agents/hire", {
    method: "POST",
    body: JSON.stringify({
      agentId: account.address,
      executorAddress,
      title: process.env.TASK_TITLE ?? "Agent-created Arc task",
      description: process.env.TASK_DESCRIPTION ?? "Complete the task and submit proof in the dashboard.",
      amountUsdc: process.env.TASK_AMOUNT_USDC ?? "1",
      deadlineHours: Number(process.env.TASK_DEADLINE_HOURS ?? "24"),
      category: process.env.TASK_CATEGORY ?? "Agent"
    })
  });
  console.log("hire", JSON.stringify(hire, null, 2));

  const escrow = hire.escrow;
  const contractAddress = escrow.contractAddress as `0x${string}`;
  const amountAtomic = BigInt(escrow.amountAtomic);
  const deadlineUnix = BigInt(escrow.deadlineUnix);
  const metadataHash = escrow.metadataHash as `0x${string}`;

  console.log("approve USDC");
  const approveHash = await walletClient.writeContract({
    account,
    chain: arcTestnet,
    address: usdcAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [contractAddress, amountAtomic]
  });
  await publicClient.waitForTransactionReceipt({ hash: approveHash });

  console.log("create escrow");
  const createHash = await walletClient.writeContract({
    account,
    chain: arcTestnet,
    address: contractAddress,
    abi: marketplaceAbi,
    functionName: "createTask",
    args: [escrow.executorAddress as `0x${string}`, amountAtomic, deadlineUnix, metadataHash]
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
  const logs = parseEventLogs({ abi: marketplaceAbi, logs: receipt.logs, eventName: "TaskCreated" });
  const chainTaskId = logs[0]?.args.taskId?.toString();
  if (!chainTaskId) throw new Error("TaskCreated event missing");

  await fetch(`${base}/api/tasks/${hire.task.id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "Open", txHash: createHash, chainTaskId })
  });
  console.log("funded", { appTaskId: hire.task.id, chainTaskId, createHash });

  const confirmAppTaskId = process.env.CONFIRM_APP_TASK_ID ?? hire.task.id;
  const confirmChainTaskId = process.env.CONFIRM_CHAIN_TASK_ID;
  if (confirmChainTaskId) {
    const proof = await api(`/api/v1/agents/tasks/${confirmAppTaskId}/proof`);
    console.log("proof", JSON.stringify(proof, null, 2));
    if (!proof.proofHash) throw new Error("No proof yet");
    const confirmHash = await walletClient.writeContract({
      account,
      chain: arcTestnet,
      address: contractAddress,
      abi: marketplaceAbi,
      functionName: "confirmCompletion",
      args: [BigInt(confirmChainTaskId)]
    });
    await publicClient.waitForTransactionReceipt({ hash: confirmHash });
    console.log("confirmed", confirmHash);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
