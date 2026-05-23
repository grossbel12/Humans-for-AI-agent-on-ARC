"use client";

import { Wallet } from "lucide-react";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ensureArcTestnet } from "@/lib/arc-wallet";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [status, setStatus] = useState("");
  const label = status || (isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet");

  async function handleClick() {
    try {
      if (isConnected) {
        disconnect();
        return;
      }
      setStatus("Connect");
      await connectAsync({ connector: connectors[0] });
      setStatus("Switch Arc");
      await ensureArcTestnet();
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message.slice(0, 24) : "Wallet failed");
    }
  }

  return (
    <button
      type="button"
      className="btn btn-soft"
      onClick={handleClick}
    >
      <Wallet size={16} />
      {label}
    </button>
  );
}
