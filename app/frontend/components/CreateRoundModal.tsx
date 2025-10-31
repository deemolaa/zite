"use client";

import { useMemo, useState } from "react";
import { ethers } from "ethers";

type Props = {
  onClose: () => void;
  onCreate: (args: {
    roundId: `0x${string}`;
    beneficiary: `0x${string}`;
    goalWei64: bigint;
    startAt: bigint;
    endAt: bigint;
    policy: number;
    title: string;
    description: string;
  }) => Promise<void> | void;
  defaultBeneficiary?: `0x${string}`;
};

export function CreateRoundModal({
  onClose,
  onCreate,
  defaultBeneficiary,
}: Props) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [beneficiary, setBeneficiary] = useState<string>(
    defaultBeneficiary || ""
  );
  const [goalEth, setGoalEth] = useState("0.10");
  const [policy, setPolicy] = useState<"0" | "1" | "2">("0");
  const [startInMin, setStartInMin] = useState("0");
  const [durationMin, setDurationMin] = useState("60");
  const [busy, setBusy] = useState(false);

  const now = Math.floor(Date.now() / 1000);
  const startAt = useMemo(
    () => BigInt(now + Math.max(0, Math.floor(Number(startInMin) * 60))),
    [now, startInMin]
  );
  const endAt = useMemo(
    () =>
      BigInt(
        now +
          Math.max(60, Math.floor(Number(startInMin) * 60)) +
          Math.max(60, Math.floor(Number(durationMin) * 60))
      ),
    [now, startInMin, durationMin]
  );

  const goalWei64 = useMemo(() => {
    const n = Number(goalEth);
    if (!isFinite(n) || n <= 0) return 0n;
    return BigInt(Math.floor(n * 1e18));
  }, [goalEth]);

  async function submit() {
    if (!title || !beneficiary || goalWei64 <= 0n) return;
    setBusy(true);
    try {
      const ridHex = ethers.keccak256(
        ethers.toUtf8Bytes(`${title}:${Date.now()}:${beneficiary}`)
      ) as `0x${string}`;
      await onCreate({
        roundId: ridHex,
        beneficiary: beneficiary as `0x${string}`,
        goalWei64,
        startAt,
        endAt,
        policy: Number(policy),
        title,
        description: desc,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Donation Round</h2>
          <button className="text-gray-500 hover:text-black" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="grid gap-3">
          <label className="grid gap-1 text-sm">
            <span className="text-gray-600">Title</span>
            <input
              className="border rounded-lg px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Anonymous Impact for School Laptops"
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-gray-600">Description</span>
            <textarea
              className="border rounded-lg px-3 py-2"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Raising funds to equip 20 students with laptops."
            />
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-gray-600">Beneficiary address</span>
            <input
              className="border rounded-lg px-3 py-2 font-mono"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="0x…"
            />
          </label>

          <div className="grid grid-cols-1">
            <label className="grid gap-1 text-sm">
              <span className="text-gray-600">Goal (ETH)</span>
              <input
                className="border rounded-lg px-3 py-2"
                value={goalEth}
                onChange={(e) => setGoalEth(e.target.value)}
                placeholder="0.10"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-gray-600">Starts in (min)</span>
              <input
                className="border rounded-lg px-3 py-2"
                value={startInMin}
                onChange={(e) => setStartInMin(e.target.value)}
                placeholder="0"
              />
            </label>

            <label className="grid gap-1 text-sm">
              <span className="text-gray-600">Duration (min)</span>
              <input
                className="border rounded-lg px-3 py-2"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="60"
              />
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="text-gray-600">Reveal policy</span>
            <select
              className="border rounded-lg px-3 py-2"
              value={policy}
              onChange={(e) => setPolicy(e.target.value as "0" | "1" | "2")}
            >
              <option value="0">After end</option>
              <option value="1">After end & goal</option>
              <option value="2">Never</option>
            </select>
          </label>

          <div className="text-xs text-gray-500">
            <div>
              Start at: <b>{String(startAt)}</b> (unix)
            </div>
            <div>
              End at: <b>{String(endAt)}</b> (unix)
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button className="px-3 py-2 rounded-lg border" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
            disabled={busy || !title || !beneficiary || goalWei64 <= 0n}
            onClick={submit}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
