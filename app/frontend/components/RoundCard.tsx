"use client"

import { useEffect, useMemo, useState } from "react"
import { ethers } from "ethers"
import { PrivacyExplainerModal } from "@/components/PrivacyExplainerModal"

function shortAddr(a?: string) {
  if (!a) return "—"
  return `${a.slice(0, 6)}…${a.slice(-4)}`
}
function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n)
}
function fmtHMS(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`
}

export function RoundCard({
  slug,
  roundId,
  readRound,
  canWrite,
  canEncrypt,
  isWorking,
  round,
  myDec,
  totDec,
  donate,
  decryptMine,
  decryptTotal,
  maybeMakeTotalPublic,
  payout,
  isOwner = true,
}: {
  slug: string
  roundId: `0x${string}`
  readRound: (rid: `0x${string}`) => Promise<void> | void
  canWrite: boolean
  canEncrypt: boolean
  isWorking: boolean
  round: any | undefined
  myDec: bigint | undefined
  totDec: bigint | undefined
  donate: (rid: `0x${string}`, wei: bigint) => Promise<void> | void
  decryptMine: (rid: `0x${string}`) => Promise<void> | void
  decryptTotal: (rid: `0x${string}`) => Promise<void> | void
  maybeMakeTotalPublic: (rid: `0x${string}`) => Promise<void> | void
  payout: (rid: `0x${string}`) => Promise<void> | void
  isOwner?: boolean
}) {
  const [amount, setAmount] = useState("0.01")
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000))
  const [privacyOpen, setPrivacyOpen] = useState(false)

  useEffect(() => {
    readRound(roundId)
    const poll = setInterval(() => readRound(roundId), 10_000)
    const tick = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 1_000)
    return () => {
      clearInterval(poll)
      clearInterval(tick)
    }
  }, [roundId, readRound])

  const startAt = useMemo(() => (round?.startAt ? Number(round.startAt) : undefined), [round?.startAt])
  const endAt = useMemo(() => (round?.endAt ? Number(round.endAt) : undefined), [round?.endAt])

  const status = useMemo<"upcoming" | "live" | "ended">(() => {
    if (!startAt || !endAt) return "upcoming"
    if (nowSec < startAt) return "upcoming"
    if (nowSec > endAt) return "ended"
    return "live"
  }, [startAt, endAt, nowSec])

  const countdownLabel = useMemo(() => {
    if (!startAt || !endAt) return ""
    if (status === "upcoming") return `Starts in ${fmtHMS(startAt - nowSec)}`
    if (status === "live") return `Ends in ${fmtHMS(endAt - nowSec)}`
    return ""
  }, [status, startAt, endAt, nowSec])

  const raisedEth = useMemo(() => Number(round?.raised ?? 0n) / 1e18, [round?.raised])
  const goalEth = useMemo(
    () => (round?.goalWei64 !== undefined ? Number(round.goalWei64) / 1e18 : undefined),
    [round?.goalWei64],
  )

  const policyLabel = useMemo(() => {
    const p = Number(round?.policy ?? 0)
    return p === 0 ? "After end" : p === 1 ? "After end & goal" : "Never"
  }, [round?.policy])

  const unlocked = !!round?.totalPublicUnlocked

  const amountWei = useMemo(() => {
    const n = Number(amount)
    if (!isFinite(n) || n <= 0) return 0n
    return BigInt(Math.floor(n * 1e18))
  }, [amount])

  const myEth = myDec !== undefined ? ethers.formatEther(myDec) : undefined
  const totEth = totDec !== undefined ? ethers.formatEther(totDec) : undefined

  const donateDisabled = !canEncrypt || isWorking || amountWei === 0n || status !== "live"

  const statusConfig = {
    live: {
      bg: "bg-emerald-600",
      glow: "",
      text: "LIVE",
      icon: "●",
    },
    upcoming: {
      bg: "bg-amber-500",
      glow: "",
      text: "UPCOMING",
      icon: "◐",
    },
    ended: {
      bg: "bg-slate-500",
      glow: "",
      text: "ENDED",
      icon: "○",
    },
  }[status]

  const progressPercent = useMemo(() => {
    if (!goalEth || goalEth === 0) return 0
    return Math.min((raisedEth / goalEth) * 100, 100)
  }, [raisedEth, goalEth])

  const totalDisplay = useMemo(() => {
    if (!unlocked) return "Locked"
    if (totEth !== undefined) return `${totEth} ETH`
    return "Decrypting…"
  }, [unlocked, totEth])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <PrivacyExplainerModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />

      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-br from-slate-900 via-gray-700 to-slate-950 text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold truncate">{round?.title || `Round #${slug}`}</div>
            <div className="mt-0.5 text-[11px] text-white/70 font-mono">ID: {slug}</div>
            {round?.description && (
              <p className="mt-2 text-xs text-white/85 leading-snug line-clamp-2">{round.description}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusConfig.bg} ${statusConfig.glow}`}
            >
              <span className="text-[10px]">{statusConfig.icon}</span>
              {statusConfig.text}
            </div>

            {countdownLabel && (
              <div className="text-[11px] font-mono bg-white/10 px-2.5 py-1 rounded-full text-white/90">
                {countdownLabel}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress */}
        {goalEth !== undefined && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-slate-600">Progress</span>
              <span className="text-slate-700 font-mono">{progressPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-700 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Compact stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <div className="text-[11px] text-slate-500">Goal</div>
            <div className="text-sm font-semibold text-slate-800">{goalEth !== undefined ? `${goalEth} ETH` : "—"}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50  px-3 py-2.5">
            <div className="text-[11px] text-emerald-700">Raised</div>
            <div className="text-sm font-semibold text-emerald-800">{raisedEth.toFixed(4)} ETH</div>
            {!!round?.paidOut && (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] bg-white/70 text-emerald-700 border border-emerald-200">
                ✓ Paid out
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50  px-3 py-2.5 col-span-2 md:col-span-1">
            <div className="text-[11px] text-blue-700">Policy</div>
            <div className="text-sm font-semibold text-blue-900">{policyLabel}</div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid lg:grid-cols-3 gap-3">
          {/* Donate */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[12px] font-semibold text-slate-800">Donate</div>
              {status !== "live" && (
                <div className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 border border-amber-200 text-amber-800">
                  {status === "upcoming" ? "Opens soon" : "Ended"}
                </div>
              )}
            </div>

            <div className="mt-2 flex gap-2">
              <input
                className="border border-slate-200 rounded-lg px-3 py-2 w-full text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-amber-200"
                placeholder="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                className="shrink-0 px-3 py-2 rounded-lg text-sm font-semibold text-slate-900 bg-amber-300 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={donateDisabled}
                onClick={() => donate(roundId, amountWei)}
                title={
                  status !== "live"
                    ? "Donations are only accepted while live"
                    : "Encrypts on client, adds homomorphically on-chain"
                }
              >
                {isWorking ? "..." : "Donate"}
              </button>
            </div>

            <div className="mt-2 text-[11px] text-slate-600">
              Amounts are encrypted.{" "}
              <button className="underline hover:text-slate-800" onClick={() => setPrivacyOpen(true)}>
                How it works
              </button>
            </div>
          </div>

          {/* Mine */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50  p-3">
            <div className="text-[11px] text-slate-500">Your donation</div>
            <div className="mt-1 text-lg font-semibold text-indigo-900">
              {myEth !== undefined ? `${myEth} ETH` : "—"}
            </div>
            <button
              className="mt-2 w-full text-sm font-semibold px-3 py-2 rounded-lg border bg-white text-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => decryptMine(roundId)}
              disabled={!canEncrypt || isWorking}
            >
              Reveal
            </button>
          </div>

          {/* Total */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] text-emerald-700">Round total</div>
              {!unlocked && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 border border-emerald-200 text-emerald-800">
                  Locked
                </span>
              )}
            </div>

            <div className="mt-1 text-lg font-semibold text-emerald-900">{totalDisplay}</div>

            {unlocked && totDec === undefined && (
              <button
                className="mt-2 w-full text-sm font-semibold px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => decryptTotal(roundId)}
                disabled={isWorking || !canEncrypt}
              >
                Retry decrypt
              </button>
            )}

            {!unlocked && (
              <div className="mt-2 text-[11px] text-slate-600">
                Owner unlocks after policy is met.
              </div>
            )}
          </div>
        </div>

        {/* Owner actions */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-[12px] font-semibold text-slate-800">Owner actions</div>
            {!isOwner && (
              <div className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                Owner only
              </div>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              className="text-sm font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => maybeMakeTotalPublic(roundId)}
              disabled={!canWrite || isWorking || !isOwner}
              title={!isOwner ? "Only owner" : "Unlock total when policy is met"}
            >
              Unlock total
            </button>

            <button
              className="text-sm font-semibold px-3 py-2 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => payout(roundId)}
              disabled={!canWrite || isWorking || !isOwner}
              title={!isOwner ? "Only owner" : "Payout escrow after end"}
            >
              Payout
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 pt-2 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Creator</span>
            <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-md">{shortAddr(round?.owner)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Beneficiary</span>
            <span className="font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              {shortAddr(round?.beneficiary)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
