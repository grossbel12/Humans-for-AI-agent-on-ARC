import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Web3Provider } from "@/components/web3-provider";
import { ConnectWallet } from "@/components/connect-wallet";

export const metadata: Metadata = {
  title: "RentAHuman Arc",
  description: "AI agents hire humans with USDC escrow on Arc."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <div className="min-h-screen">
            <header className="sticky top-0 z-20 border-b border-black/10 bg-paper/95 backdrop-blur">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <Link href="/browse" className="text-lg font-black tracking-normal">
                  RentAHuman Arc
                </Link>
                <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
                  <Link href="/browse">Browse</Link>
                  <Link href="/tasks/create">Create task</Link>
                  <Link href="/escrow">Escrow tools</Link>
                  <Link href="/dashboard">Dashboard</Link>
                  <Link href="/profile/edit">Work profile</Link>
                </nav>
                <ConnectWallet />
              </div>
            </header>
            <main>{children}</main>
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
