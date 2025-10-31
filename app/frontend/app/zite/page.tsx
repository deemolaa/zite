// app/app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "../../hooks/fhevm-react";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useConfidentialDonation } from "@/hooks/useConfidentialDonation";
import { CreateRoundModal } from "@/components/CreateRoundModal";
import { RoundList } from "@/components/RoundList";

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
  } = useMetaMaskEthersSigner();

  const okChain = useMemo(
    () => (sameChain?.current ? sameChain.current(chainId) : true),
    [sameChain, chainId]
  );
  const okSigner = useMemo(
    () => (sameSigner?.current ? sameSigner.current(ethersSigner) : true),
    [sameSigner, ethersSigner]
  );

  const enabled = useMemo(
    () =>
      Boolean(
        isConnected &&
          !!provider &&
          typeof chainId === "number" &&
          okChain &&
          okSigner
      ),
    [isConnected, provider, chainId, okChain, okSigner]
  );

  const { instance, refresh } = useFhevm({
    provider,
    chainId,
    enabled: true,
    initialMockChains,
  });

  useEffect(() => {
    if (provider && typeof chainId === "number" && !instance && refresh) {
      refresh();
    }
  }, [provider, chainId, ethersSigner, instance, refresh]);

  const { storage } = useInMemoryStorage();

  const cd = useConfidentialDonation({
    instance,
    storage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
  });

  useEffect(() => {
    if (!isConnected && connect) connect();
  }, []); // eslint-disable-line
  useEffect(() => {
    if (enabled && !instance && refresh) refresh();
  }, [enabled, instance, refresh]);
  useEffect(() => {
    if (cd.canRead) cd.listAll();
  }, [cd.canRead, chainId]); // eslint-disable-line

  const [showCreate, setShowCreate] = useState(false);

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/60 border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg" />
          </Link>

          <div className="flex items-center gap-3">
            <button
              className="rounded-xl bg-[#0B2B7D] text-white px-3 py-2 text-sm disabled:opacity-50"
              onClick={() => setShowCreate(true)}
              disabled={!cd.canWrite || cd.isWorking}
            >
              + Create Round
            </button>
            {!isConnected ? (
              <button
                className="rounded-xl border px-3 py-2 text-sm"
                onClick={connect}
              >
                Connect
              </button>
            ) : (
              <span className="text-xs text-gray-600">Connected</span>
            )}
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-6">
        <div className="rounded-2xl border bg-white/60 p-4">
          <h1 className="text-xl font-semibold text-[#0B2B7D]">
            Confidential Donation Pools
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Create rounds with a reveal policy. Donors encrypt their amounts;
            totals unlock only when policy conditions are met.
          </p>
        </div>
      </section>

      {!!cd.message && (
        <div className="px-6 mb-5 text-xs text-gray-600">{cd.message}</div>
      )}

      <section className="max-w-6xl mx-auto px-6 pb-16">
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

      {showCreate && (
        <CreateRoundModal
          onClose={() => setShowCreate(false)}
          onCreate={cd.createRound}
        />
      )}
    </main>
  );
}
