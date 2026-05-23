import { ARC_CHAIN_ID, ARC_EXPLORER, ARC_RPC_URL } from "@/lib/constants";

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};

const ARC_CHAIN_HEX = `0x${ARC_CHAIN_ID.toString(16)}`;

function getEthereum() {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum;
}

export async function ensureArcTestnet() {
  const ethereum = getEthereum();
  if (!ethereum) return;

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_CHAIN_HEX }]
    });
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: number }).code : undefined;
    if (code !== 4902) throw error;

    await ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: ARC_CHAIN_HEX,
          chainName: "Arc Testnet",
          nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
          rpcUrls: [ARC_RPC_URL],
          blockExplorerUrls: [ARC_EXPLORER]
        }
      ]
    });
  }

  const currentChainId = await ethereum.request({ method: "eth_chainId" });
  if (String(currentChainId).toLowerCase() !== ARC_CHAIN_HEX) {
    throw new Error(`Switch wallet to Arc Testnet (${ARC_CHAIN_ID})`);
  }
}
