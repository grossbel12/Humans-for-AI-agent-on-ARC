export const ARC_CHAIN_ID = Number(process.env.NEXT_PUBLIC_ARC_CHAIN_ID ?? "5042002");
export const ARC_RPC_URL =
  process.env.NEXT_PUBLIC_ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
export const ARC_EXPLORER =
  process.env.NEXT_PUBLIC_ARC_EXPLORER ?? "https://testnet.arcscan.app";
export const USDC_ADDRESS =
  (process.env.NEXT_PUBLIC_USDC_ADDRESS ??
    "0x3600000000000000000000000000000000000000") as `0x${string}`;
export const MARKETPLACE_ADDRESS =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
export const USDC_DECIMALS = 6;
export const FINAL_TASK_STATUSES = ["Completed", "Cancelled", "AutoReleased"];
