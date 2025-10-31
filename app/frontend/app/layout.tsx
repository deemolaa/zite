import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";
import { HeaderWallet } from "@/components/HeaderWallet";

export const metadata: Metadata = {
  title: "Zite - Confidential Donation",
  description: "Private donations with policy-gated option using Zama FHEVM.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`zama-bg text-foreground antialiased`}>
        <Providers>
          <div className="fixed inset-0 w-full h-full zama-bg z-[-20] min-w-[850px]"></div>

          <main className="flex flex-col max-w-screen-lg mx-auto pb-20 min-w-[850px]">
            <nav className="flex w-full px-3 md:px-0 h-fit py-10 justify-between items-center">
              <div className="text-[#ff9c08]">
                <h1 className="text-2xl">ZITE - CONFIDENTIAL DONATION</h1>
                <p>Powered by FHE Zama</p>
              </div>

              <HeaderWallet />
            </nav>

            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
