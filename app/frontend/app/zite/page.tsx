// app/app/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner"
import { useRelayerInstance } from "@/hooks/useRelayerInstance"
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage"
import { useConfidentialDonation } from "@/hooks/useConfidentialDonation"
import { CreateRoundModal } from "@/components/CreateRoundModal"
import { RoundList } from "@/components/RoundList"

export default function AppPage() {
  const {
    provider,
    chainId,
    sameChain,
    sameSigner,
    initialMockChains,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
  } = useMetaMaskEthersSigner()

  const okChain = useMemo(() => (sameChain?.current ? sameChain.current(chainId) : true), [sameChain, chainId])
  const okSigner = useMemo(
    () => (sameSigner?.current ? sameSigner.current(ethersSigner) : true),
    [sameSigner, ethersSigner],
  )

  const enabled = useMemo(
    () => Boolean(isConnected && !!provider && typeof chainId === "number" && okChain && okSigner),
    [isConnected, provider, chainId, okChain, okSigner],
  )

  const { instance, refresh, error } = useRelayerInstance({
    provider,
    chainId,
    enabled,
  })

  useEffect(() => {
    if (provider && typeof chainId === "number" && !instance && refresh) {
      refresh()
    }
  }, [provider, chainId, ethersSigner, instance, refresh])

  const { storage } = useInMemoryStorage()

  const cd = useConfidentialDonation({
    instance,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
  })

  useEffect(() => {
    if (!isConnected && connect) connect()
  }, []) // eslint-disable-line
  useEffect(() => {
    if (enabled && !instance && refresh) refresh()
  }, [enabled, instance, refresh])
  useEffect(() => {
    if (cd.canRead) cd.listAll()
  }, [cd.canRead, chainId]) // eslint-disable-line

  const [showCreate, setShowCreate] = useState(false)

  return (
    <main className="min-h-screen">
 

      <section className="max-w-7xl mx-auto px-6">
        
        <div className="rounded-3xl border border-white/60 bg-white backdrop-blur-sm shadow-xl shadow-blue-500/5 overflow-hidden">

             <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
            <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-950 bg-clip-text text-transparent">
              Confidential Donation Pools
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <button
              className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-950 text-white px-5 py-2.5 text-sm font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
              onClick={() => setShowCreate(true)}
              disabled={!cd.canWrite || cd.isWorking}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Round
              </span>
            </button>
            {/* {!isConnected ? (
              <button
                className="rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 px-5 py-2.5 text-sm font-medium transition-all hover:border-gray-300"
                onClick={connect}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Connect Wallet
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            )} */}
          </div>
        </div>
      </header>
      
          <div className="p-2 md:p-6">
            <div className="flex items-start justify-between gap-6">
               
                <p className="text-sm font-bold text-gray-600 max-w-2xl text-pretty leading-relaxed">
                  Create rounds with a reveal policy. Donors encrypt their amounts;
            totals unlock only when policy conditions are met.
                </p>
            </div>

        
          </div>
        </div>
      </section>

      {!!cd.message && (
        <div className="max-w-7xl mx-auto px-6 py-8 pt-12">
          <div className="p-4 rounded-xl bg-white border border-blue-200">
            <p className="text-sm text-blue-800">{cd.message}</p>
          </div>
        </div>
      )}

      <section className="max-w-7xl mx-auto px-6 pt-6 pb-20">
        <RoundList
          rounds={cd.rounds}
          roundsMap={cd.roundsMap}
          decMines={cd.decMines}
          decTotals={cd.decTotals}
          readRound={cd.readRound}
          canWrite={cd.canWrite}
          isWorking={cd.isWorking}
          donate={cd.donate}
          decryptMine={cd.decryptMine}
          decryptTotal={cd.decryptTotal}
          maybeMakeTotalPublic={cd.maybeMakeTotalPublic}
          payout={cd.payout}
          isOwner={cd.isOwner}
        />
      </section>

      {showCreate && <CreateRoundModal onClose={() => setShowCreate(false)} onCreate={cd.createRound} />}
    </main>
  )
}
