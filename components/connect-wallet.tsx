"use client";

import { Wallet } from "lucide-react";
import { useAccount, useConnect, useDisconnect } from "wagmi";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const label = isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet";
  return (
    <button
      type="button"
      className="btn btn-soft"
      onClick={() => (isConnected ? disconnect() : connect({ connector: connectors[0] }))}
    >
      <Wallet size={16} />
      {label}
    </button>
  );
}
