"use client";

import { useState } from "react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");

type Props = {
  rightIcon?: React.ReactNode;
};

export function HeaderWallet({ rightIcon }: Props) {
  const { isConnected, connect, accounts, chainId, eip1193 } = useMetaMaskEthersSigner();
  const [busy, setBusy] = useState(false);
  const addr = accounts?.[0];
  const onSepolia = chainId === 11155111;

  const onConnect = async () => {
    setBusy(true);
    try { await connect(); } finally { setBusy(false); }
  };

  const onCopy = async () => { if (addr) await navigator.clipboard.writeText(addr); };

  const onSwitchToSepolia = async () => {
    if (!eip1193) return;
    setBusy(true);
    try {
      await eip1193.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // 11155111 hex
      });
    } catch (err: any) {
      // Fallback: add Sepolia if wallet doesn't know it yet
      try {
        await eip1193.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0xaa36a7",
            chainName: "Sepolia",
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"]
          }],
        });
      } catch (_) { /* ignore */ }
    } finally {
      setBusy(false);
    }
  };

  const onDisconnect = async () => {
    setBusy(true);
    try {
      await eip1193?.request?.({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      }).catch(() => {});
    } finally {
      window.location.reload();
    }
  };

  return (
    <div className="flex items-center gap-2">
 
      {/* Wallet controls */}
      <div className="flex items-center gap-2">
        {!isConnected ? (
          <button
            onClick={onConnect}
            disabled={busy}
            className="px-3 py-1 rounded-xl border bg-white/80 backdrop-blur hover:bg-white disabled:opacity-50"
            title="Connect wallet"
          >
            {busy ? "…" : "Connect"}
          </button>
        ) : (
          <>
            {!onSepolia && (
              <button
                onClick={onSwitchToSepolia}
                disabled={busy}
                className="px-3 py-1 rounded-xl border bg-white/80 backdrop-blur hover:bg-white disabled:opacity-50"
                title="Switch to Sepolia"
              >
                {busy ? "…" : "Switch"}
              </button>
            )}

            <button
              onClick={onCopy}
              className="px-3 py-1 rounded-xl border bg-white/80 backdrop-blur hover:bg-white font-mono text-sm"
              title={addr ?? "Address"}
            >
              {short(addr)}
            </button>

            <button
              onClick={onDisconnect}
              disabled={busy}
              className="px-3 py-1 rounded-xl border bg-white/80 backdrop-blur hover:bg-white disabled:opacity-50"
              title="Disconnect wallet"
            >
              {busy ? "…" : "Disconnect"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
