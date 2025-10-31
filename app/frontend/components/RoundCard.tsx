// components/RoundCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";

function shortAddr(a?: string) {
  if (!a) return "—";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}
function fmtHMS(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
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
  isOwner = true, // can override if compute owner elsewhere
}: {
  slug: string;
  roundId: `0x${string}`;
  readRound: (rid: `0x${string}`) => Promise<void> | void;
  canWrite: boolean;
  canEncrypt: boolean;
  isWorking: boolean;
  round: any | undefined;
  myDec: bigint | undefined;
  totDec: bigint | undefined;
  donate: (rid: `0x${string}`, wei: bigint) => Promise<void> | void;
  decryptMine: (rid: `0x${string}`) => Promise<void> | void;
  decryptTotal: (rid: `0x${string}`) => Promise<void> | void;
  maybeMakeTotalPublic: (rid: `0x${string}`) => Promise<void> | void;
  payout: (rid: `0x${string}`) => Promise<void> | void;
  isOwner?: boolean;
}) {
  const [amount, setAmount] = useState("0.01");
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    readRound(roundId);
    const poll = setInterval(() => readRound(roundId), 10_000);
    const tick = setInterval(
      () => setNowSec(Math.floor(Date.now() / 1000)),
      1_000
    );
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [roundId, readRound]);

  const startAt = useMemo(
    () => (round?.startAt ? Number(round.startAt) : undefined),
    [round?.startAt]
  );
  const endAt = useMemo(
    () => (round?.endAt ? Number(round.endAt) : undefined),
    [round?.endAt]
  );

  const raisedEth = useMemo(
    () => Number(round?.raised ?? 0n) / 1e18,
    [round?.raised]
  );
  const paidOut = !!round?.paidOut;
  

  const status = useMemo<"upcoming" | "live" | "ended">(() => {
    if (!startAt || !endAt) return "upcoming";
    if (nowSec < startAt) return "upcoming";
    if (nowSec > endAt) return "ended";
    return "live";
  }, [startAt, endAt, nowSec]);

  const countdownLabel = useMemo(() => {
    if (!startAt || !endAt) return "";
    if (status === "upcoming") return `Starts in ${fmtHMS(startAt - nowSec)}`;
    if (status === "live") return `Ends in ${fmtHMS(endAt - nowSec)}`;
    return "Ended";
  }, [status, startAt, endAt, nowSec]);

  const goalEth = useMemo(
    () =>
      round?.goalWei64 !== undefined
        ? Number(round.goalWei64) / 1e18
        : undefined,
    [round?.goalWei64]
  );
  const escrowEth = useMemo(
    () => Number(round?.escrow ?? 0n) / 1e18,
    [round?.escrow]
  );
  const unlocked = !!round?.totalPublicUnlocked;

  const policyLabel = useMemo(() => {
    const p = Number(round?.policy ?? 0);
    return p === 0 ? "After end" : p === 1 ? "After end & goal" : "Never";
  }, [round?.policy]);

  const amountWei = useMemo(() => {
    const n = Number(amount);
    if (!isFinite(n) || n <= 0) return 0n;
    return BigInt(Math.floor(n * 1e18));
  }, [amount]);

  const myEth = myDec !== undefined ? ethers.formatEther(myDec) : undefined;
  const totEth = totDec !== undefined ? ethers.formatEther(totDec) : undefined;

  const donateDisabled =
    !canEncrypt || isWorking || amountWei === 0n || status !== "live";
  const pill =
    status === "live"
      ? "bg-emerald-600"
      : status === "upcoming"
      ? "bg-amber-500"
      : "bg-gray-400";

  return (
    <div className="rounded-2xl border bg-white/70 backdrop-blur-sm overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-gradient-to-r from-[#0B2B7D] via-[#1D4ED8] to-[#0EA5E9] text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="h-6 w-6 rounded-md"
              style={{ background: "#FFD200" }}
            />
            <div className="font-semibold">{round?.title || `#${slug}`}</div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-full ${pill}`}>
              {status.toUpperCase()}
            </span>
            <span className="opacity-90">{countdownLabel}</span>
          </div>
        </div>
        {round?.description && (
          <p className="mt-2 text-white/90 text-xs md:text-[13px]">
            {round.description}
          </p>
        )}
      </div>

      <div className="p-4 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-white/60 p-3">
                <div className="text-[11px] text-gray-500">Goal</div>
                <div className="text-lg font-semibold">
                  {goalEth !== undefined ? `${goalEth} ETH` : "—"}
                </div>
              </div>
              <div className="rounded-xl border bg-white/60 p-3">
                <div className="text-[11px] text-gray-500">Raised so far</div>
                <div className="text-lg font-semibold">
                  {raisedEth.toFixed(4)} ETH
                </div>
                {paidOut && (
      <div className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
        ✓ Paid out
      </div>
    )}
              </div>
              <div className="rounded-xl border bg-white/60 p-3">
                <div className="text-[11px] text-gray-500">Reveal policy</div>
                <div className="text-lg font-semibold">{policyLabel}</div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[320px] rounded-xl border bg-white/70 p-3">
            <div className="text-sm font-medium text-[#0B2B7D]">
              Donate privately
            </div>
            <div className="mt-2 flex gap-2">
              <input
                className="border rounded-xl px-3 py-2 w-36"
                placeholder="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <button
                className="px-4 py-2 rounded-xl text-[#0B2B7D] disabled:opacity-50"
                style={{ background: "#FFD200" }}
                disabled={donateDisabled}
                onClick={() => donate(roundId, amountWei)}
                title={
                  status !== "live"
                    ? "Donations are only accepted while live"
                    : "Encrypts on client, adds homomorphically on-chain"
                }
              >
                Donate
              </button>
            </div>
            {status !== "live" && (
              <div className="mt-1 text-[11px] text-amber-600">
                {status === "upcoming"
                  ? "Donations open when the round starts."
                  : "This round has ended."}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white/60 p-3">
          <div className="grid md:grid-cols-3 gap-3">
            <div className=" items-end justify-end">
              <div className="mb-2">
                <div className="text-[11px] text-gray-500">
                  Your donation amount:
                </div>
                <div className="text-xl font-semibold">
                  {myEth !== undefined ? `${myEth} ETH` : "..."}
                </div>
              </div>
              <button
                className="text-xs px-3 py-1.5 rounded-xl bg-[#1D4ED8] text-white disabled:opacity-50"
                onClick={() => decryptMine(roundId)}
                disabled={!canEncrypt || isWorking}
              >
                Click to show
              </button>
            </div>

            <div className="items-center mx-auto justify-end">
              <div className="mb-2">
                <div className="text-[11px] text-gray-500">Round total:</div>
                <div className="text-xl font-semibold">
                  {totEth !== undefined
                    ? `${totEth} ETH`
                    : unlocked
                    ? ".."
                    : "locked"}
                </div>
              </div>
              <button
                className="text-xs px-3 py-1.5 rounded-xl bg-[#1D4ED8] text-white disabled:opacity-50"
                onClick={() => decryptTotal(roundId)}
                disabled={!canEncrypt || isWorking || !unlocked}
              >
                Display total
              </button>
            </div>

            <div className="flex items-end justify-end gap-2">
              <button
                className="text-xs px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                onClick={() => maybeMakeTotalPublic(roundId)}
                disabled={!canWrite || isWorking || !isOwner}
              >
                Make round public
              </button>
              <button
                className="text-xs px-3 py-1.5 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                onClick={() => payout(roundId)}
                disabled={!canWrite || isWorking || !isOwner}
              >
                💸 Payout
              </button>
            </div>
          </div>

          <div className="justify-end items-en mt-3 text-[11px] text-gray-600 flex gap-3">
            <div>
              Donation creator:{" "}
              <b className="font-mono">{shortAddr(round?.owner)}</b>
            </div>
            <div>
              Beneficiary:{" "}
              <b className="font-mono">{shortAddr(round?.beneficiary)}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
