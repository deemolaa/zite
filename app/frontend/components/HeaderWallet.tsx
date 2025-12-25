"use client"

import type React from "react"

import { useState } from "react"
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner"
import { Wallet, Copy, LogOut, AlertCircle, CheckCircle } from "lucide-react"

const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—")

type Props = {
  rightIcon?: React.ReactNode
}

export function HeaderWallet({ rightIcon }: Props) {
  const { isConnected, connect, accounts, chainId, eip1193 } = useMetaMaskEthersSigner()
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const addr = accounts?.[0]
  const onSepolia = chainId === 11155111

  const onConnect = async () => {
    setBusy(true)
    try {
      await connect()
    } finally {
      setBusy(false)
    }
  }

  const onCopy = async () => {
    if (addr) {
      await navigator.clipboard.writeText(addr)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const onSwitchToSepolia = async () => {
    if (!eip1193) return
    setBusy(true)
    try {
      await eip1193.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      })
    } catch (err: any) {
      try {
        await eip1193.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0xaa36a7",
              chainName: "Sepolia",
              nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        })
      } catch (_) {
        /* ignore */
      }
    } finally {
      setBusy(false)
    }
  }

  const onDisconnect = async () => {
    setBusy(true)
    try {
      await eip1193
        ?.request?.({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        })
        .catch(() => {})
    } finally {
      window.location.reload()
    }
  }

  return (
    <div className="flex items-center gap-3">
      {rightIcon && <div className="mr-2">{rightIcon}</div>}

      <div className="flex items-center gap-2">
        {!isConnected ? (
          <button
            onClick={onConnect}
            disabled={busy}
            className="group relative px-5 py-2.5 rounded-xl font-medium text-black bg-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            title="Connect wallet"
          >
            <span className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              {busy ? "Connecting..." : "Connect Wallet"}
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Network status badge */}
            {onSepolia ? (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Sepolia</span>
              </div>
            ) : (
              <button
                onClick={onSwitchToSepolia}
                disabled={busy}
                className="group flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                title="Switch to Sepolia"
              >
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">{busy ? "Switching..." : "Wrong Network"}</span>
              </button>
            )}

            {/* Address display with copy */}
            <button
              onClick={onCopy}
              className="group relative px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 font-mono text-sm transition-all duration-300 hover:shadow-md"
              title={copied ? "Copied!" : (addr ?? "Address")}
            >
              <span className="flex items-center gap-2">
                {short(addr)}
                <Copy
                  className={`w-3.5 h-3.5 transition-all duration-300 ${copied ? "text-green-600 scale-110" : "text-gray-400 group-hover:text-blue-600"}`}
                />
              </span>
              {copied && (
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap">
                  Copied!
                </span>
              )}
            </button>

            {/* Disconnect button */}
            <button
              onClick={onDisconnect}
              disabled={busy}
              className="group px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-red-300 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md"
              title="Disconnect wallet"
            >
              <LogOut className="w-4 h-4 text-gray-600 group-hover:text-red-600 transition-colors duration-300" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
