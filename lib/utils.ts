import { clsx, type ClassValue } from "clsx";
import { createHash } from "crypto";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function normalizeAddress(address: string) {
  return address.toLowerCase();
}

export function usdcToAtomic(value: string | number) {
  const [wholeRaw, fracRaw = ""] = String(value).trim().split(".");
  const whole = wholeRaw || "0";
  const frac = (fracRaw + "000000").slice(0, 6);
  return (BigInt(whole) * 1_000_000n + BigInt(frac)).toString();
}

export function atomicToUsdc(value: string | bigint) {
  const n = BigInt(value);
  const whole = n / 1_000_000n;
  const frac = (n % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : whole.toString();
}

export function bytes32Hash(input: unknown) {
  return `0x${createHash("sha256").update(JSON.stringify(input)).digest("hex")}`;
}

export function apiError(message: string, status = 400, code = "bad_request") {
  return Response.json({ error: { code, message } }, { status });
}
