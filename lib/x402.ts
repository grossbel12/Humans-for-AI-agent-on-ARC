import { HTTPFacilitatorClient, x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";

export function getX402Server() {
  const facilitator = new HTTPFacilitatorClient({
    url: process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator"
  });
  return new x402ResourceServer(facilitator).register(
    (process.env.X402_NETWORK ?? "eip155:5042002") as `${string}:${string}`,
    new ExactEvmScheme()
  );
}

export function x402Payment(price: string, description: string) {
  const payTo = process.env.MARKETPLACE_WALLET_ADDRESS;
  if (!payTo) throw new Error("MARKETPLACE_WALLET_ADDRESS missing");
  return x402PaymentTo(price, description, payTo);
}

export function x402PaymentTo(price: string, description: string, payTo: string) {
  if (!payTo) throw new Error("x402 payTo missing");
  const network = (process.env.X402_NETWORK ?? "eip155:5042002") as `${string}:${string}`;
  return {
    accepts: [
      {
        scheme: "exact" as const,
        price,
        network,
        payTo
      }
    ],
    description,
    mimeType: "application/json"
  };
}
