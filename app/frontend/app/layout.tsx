import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "./providers"
import { HeaderWallet } from "@/components/HeaderWallet"
import RelayerSdkLoader from "@/components/RelayerSdkLoader"

export const metadata: Metadata = {
  title: "Zite - Confidential Donation",
  description: "Private donations with policy-gated option using Zama FHEVM.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <RelayerSdkLoader />
        <Providers>
          <div className="fixed inset-0 w-full h-full bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 z-[-20] min-w-[850px]">
            <div className="absolute inset-0 bg-linear-to-tr from-orange-500/5 via-transparent to-purple-500/5" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,156,8,0.05),transparent_50%)]" />
          </div>

          <main className="flex flex-col max-w-5xl mx-auto pb-20 min-w-212.5">
            <nav className="flex w-full px-3 md:px-0 h-fit py-10 justify-between items-center backdrop-blur-sm rounded-lg mx-3 md:mx-0 mb-8">
              <div className="flex items-center gap-4 px-6">
                <div>
                   <span className="relative inline-block">
              <span className="absolute inset-0 bg-amber-400 blur-xl opacity-50" />
              <span className="text-5xl relative rounded-xl px-3 py-1 bg-amber-400 text-blue-950 font-extrabold">
                Zite
              </span>
            </span>
                </div>
              </div>

              <div className="px-6">
                <HeaderWallet />
              </div>
            </nav>

            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
