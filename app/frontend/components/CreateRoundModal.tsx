"use client"

import { useMemo, useState } from "react"
import { ethers } from "ethers"
import { Clock, Target, Calendar, Shield, User, FileText } from "lucide-react"

type Props = {
  onClose: () => void
  onCreate: (args: {
    roundId: `0x${string}`
    beneficiary: `0x${string}`
    goalWei64: bigint
    startAt: bigint
    endAt: bigint
    policy: number
    title: string
    description: string
  }) => Promise<void> | void
  defaultBeneficiary?: `0x${string}`
}

export function CreateRoundModal({ onClose, onCreate, defaultBeneficiary }: Props) {
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [beneficiary, setBeneficiary] = useState<string>(defaultBeneficiary || "")
  const [goalEth, setGoalEth] = useState("0.10")
  const [policy, setPolicy] = useState<"0" | "1" | "2">("0")
  const [startInMin, setStartInMin] = useState("0")
  const [durationMin, setDurationMin] = useState("60")
  const [busy, setBusy] = useState(false)

  const now = Math.floor(Date.now() / 1000)
  const startAt = useMemo(() => BigInt(now + Math.max(0, Math.floor(Number(startInMin) * 60))), [now, startInMin])
  const endAt = useMemo(
    () =>
      BigInt(
        now + Math.max(60, Math.floor(Number(startInMin) * 60)) + Math.max(60, Math.floor(Number(durationMin) * 60)),
      ),
    [now, startInMin, durationMin],
  )

  const goalWei64 = useMemo(() => {
    const n = Number(goalEth)
    if (!isFinite(n) || n <= 0) return 0n
    return BigInt(Math.floor(n * 1e18))
  }, [goalEth])

  async function submit() {
    if (!title || !beneficiary || goalWei64 <= 0n) return
    setBusy(true)
    try {
      const ridHex = ethers.keccak256(ethers.toUtf8Bytes(`${title}:${Date.now()}:${beneficiary}`)) as `0x${string}`
      await onCreate({
        roundId: ridHex,
        beneficiary: beneficiary as `0x${string}`,
        goalWei64,
        startAt,
        endAt,
        policy: Number(policy),
        title,
        description: desc,
      })
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-gradient-to-br from-white to-gray-50 shadow-2xl border border-gray-200/50 overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 via-gray-700 to-slate-950 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Create Donation Round</h2>
          </div>
          <button
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all hover:rotate-90 duration-200 flex items-center justify-center"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="w-4 h-4 text-indigo-600" />
              Round Title
            </label>
            <input
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Anonymous Impact for School Laptops"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <FileText className="w-4 h-4 text-indigo-600" />
              Description
            </label>
            <textarea
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Raising funds to equip 20 students with laptops."
              rows={3}
            />
          </div>

          {/* Beneficiary */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <User className="w-4 h-4 text-indigo-600" />
              Beneficiary Address
            </label>
            <input
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 font-mono text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="0x..."
            />
          </div>

          {/* Grid Layout for Goal and Timing */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Goal */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Target className="w-4 h-4 text-emerald-600" />
                Goal (ETH)
              </label>
              <input
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                value={goalEth}
                onChange={(e) => setGoalEth(e.target.value)}
                placeholder="0.10"
              />
            </div>

            {/* Start In */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Clock className="w-4 h-4 text-blue-600" />
                Starts in (min)
              </label>
              <input
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                value={startInMin}
                onChange={(e) => setStartInMin(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Calendar className="w-4 h-4 text-purple-600" />
                Duration (min)
              </label>
              <input
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="60"
              />
            </div>
          </div>

          {/* Reveal Policy */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Shield className="w-4 h-4 text-amber-600" />
              Reveal Policy
            </label>
            <select
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all cursor-pointer bg-white"
              value={policy}
              onChange={(e) => setPolicy(e.target.value as "0" | "1" | "2")}
            >
              <option value="0">After end</option>
              <option value="1">After end & goal reached</option>
              <option value="2">Never reveal</option>
            </select>
          </div>

          {/* Timeline Info */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
              <Calendar className="w-3.5 h-3.5" />
              Timeline Details
            </div>
            <div className="text-xs text-indigo-700 space-y-0.5 pl-5">
              <div>
                Start at: <span className="font-mono font-semibold">{String(startAt)}</span> (unix)
              </div>
              <div>
                End at: <span className="font-mono font-semibold">{String(endAt)}</span> (unix)
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            className="px-6 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-all hover:scale-105 active:scale-95"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-6 py-2.5 rounded-xl bg-gradient-to-br from-slate-900 via-gray-700 to-slate-950 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
            disabled={busy || !title || !beneficiary || goalWei64 <= 0n}
            onClick={submit}
          >
            {busy ? "Creating..." : "Create Round"}
          </button>
        </div>
      </div>
    </div>
  )
}
