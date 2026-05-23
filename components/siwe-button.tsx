"use client";

import { SiweMessage } from "siwe";
import { ShieldCheck } from "lucide-react";
import { useAccount, useSignMessage } from "wagmi";
import { useState } from "react";

export function SiweButton() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [status, setStatus] = useState("");

  async function signIn() {
    if (!address) return;
    setStatus("Signing");
    const nonceRes = await fetch("/api/auth/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address })
    });
    const { nonce } = await nonceRes.json();
    const message = new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in to RentAHuman Arc.",
      uri: window.location.origin,
      version: "1",
      chainId,
      nonce
    }).prepareMessage();
    const signature = await signMessageAsync({ message });
    const verify = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, signature })
    });
    setStatus(verify.ok ? "Signed in" : "Failed");
  }

  return (
    <button type="button" onClick={signIn} className="btn btn-soft">
      <ShieldCheck size={16} />
      {status || "SIWE"}
    </button>
  );
}
