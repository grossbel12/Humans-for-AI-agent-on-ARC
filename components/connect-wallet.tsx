"use client";

import { Wallet } from "lucide-react";
import { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ensureArcTestnet } from "@/lib/arc-wallet";

function shortWalletError(error: unknown) {
  const message = error instanceof Error ? error.message : "Wallet failed";
  if (/provider not found|not found|no provider/i.test(message)) return "Open with MetaMask";
  if (/user rejected|rejected/i.test(message)) return "Rejected";
  return message.slice(0, 24);
}

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [status, setStatus] = useState("");
  const label = status || (isConnected && address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Wallet");

  async function handleClick() {
    try {
      if (isConnected) {
        setStatus("Switch Arc");
        await ensureArcTestnet();
        setStatus("");
        return;
      }
      setStatus("Connect");
      const connector = connectors.find((item) => item.id === "metaMask" || /metamask/i.test(item.name)) ?? connectors[0];
      await connectAsync({ connector });
      setStatus("Switch Arc");
      await ensureArcTestnet();
      setStatus("");
    } catch (error) {
      if (isConnected) disconnect();
      setStatus(shortWalletError(error));
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
