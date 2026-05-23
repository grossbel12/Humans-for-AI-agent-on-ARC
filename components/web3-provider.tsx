"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { defineChain } from "viem";
import { injected } from "wagmi/connectors";
import { ARC_CHAIN_ID, ARC_EXPLORER, ARC_RPC_URL } from "@/lib/constants";
import { useState } from "react";

const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [ARC_RPC_URL], webSocket: ["wss://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "Arcscan", url: ARC_EXPLORER } }
});

const config = createConfig({
  chains: [arcTestnet],
  connectors: [injected()],
  transports: { [arcTestnet.id]: http(ARC_RPC_URL) }
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
