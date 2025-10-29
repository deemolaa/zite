import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import Image from "next/image";
import { HeaderWallet } from "@/components/HeaderWallet";

export const metadata: Metadata = {
  title: "Confidential donation pool",
  description: "Private donations with policy-gated public totals via Zama FHEVM.",
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
              <Image
                src="/zama-logo.svg"
                alt="Zama Logo"
                width={120}
                height={120}
              />
              <HeaderWallet />
            </nav>

            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
