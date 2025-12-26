"use client";

import React from "react";

export function PrivacyExplainerModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <button
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close"
      />

      {/* modal */}
      <div className="relative w-[92%] max-w-lg rounded-2xl bg-white shadow-xl border p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[#0B2B7D]">
              How privacy works
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Your donation amount is encrypted on your device using FHEVM.
            </p>
          </div>
          <button
            className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm text-gray-700">
          <div className="rounded-xl border bg-gray-50 p-3">
            <div className="font-medium">1) Encrypt in your browser 🔒</div>
            <div className="text-gray-600">
              Your amount is encrypted before it ever hits the blockchain.
            </div>
          </div>

          <div className="rounded-xl border bg-gray-50 p-3">
            <div className="font-medium">2) Add privately on-chain ➕</div>
            <div className="text-gray-600">
              The contract updates totals using encrypted math (homomorphic).
            </div>
          </div>

          <div className="rounded-xl border bg-gray-50 p-3">
            <div className="font-medium">3) Reveal only when allowed ✅</div>
            <div className="text-gray-600">
              The total can only be decrypted once the round owner unlocks it and
              the policy conditions are met.
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Note: the chain never stores your plaintext donation amount.
        </div>
      </div>
    </div>
  );
}
