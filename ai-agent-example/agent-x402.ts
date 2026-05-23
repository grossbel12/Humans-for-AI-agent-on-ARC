import "dotenv/config";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { wrapFetchWithPayment } from "@x402/fetch";
import { privateKeyToAccount } from "viem/accounts";

if (!process.env.EVM_PRIVATE_KEY) throw new Error("EVM_PRIVATE_KEY missing");

const account = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);
const client = new x402Client();
client.register("eip155:*", new ExactEvmScheme(account));
const paidFetch = wrapFetchWithPayment(fetch, client);
const base = process.env.MARKETPLACE_API_URL ?? "http://localhost:3000";

const res = await paidFetch(`${base}/api/v1/agents/humans?skill=photo&limit=3`);
console.log(await res.json());
