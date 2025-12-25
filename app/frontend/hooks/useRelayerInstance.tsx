"use client";

import { useCallback, useEffect, useState } from "react";
import type { Eip1193Provider } from "ethers";
import { initFhevmSdkOnce } from "@/hooks/fhevmSdkSingleton";

export type RelayerInstance = any;

type Params = {
  provider?: Eip1193Provider;
  chainId?: number;
  enabled?: boolean;
};

function ensureBrowserGlobals() {
  const g: any = globalThis as any;
  if (typeof g.global === "undefined") g.global = g;
  if (typeof g.process === "undefined") g.process = { env: {} };
}

export function useRelayerInstance({ provider, chainId, enabled }: Params) {
  const [instance, setInstance] = useState<RelayerInstance | undefined>();
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!enabled || !provider || typeof chainId !== "number") return;

    try {
      setError("");
      ensureBrowserGlobals();

      // ✅ init wasm ONCE (stable)
      await initFhevmSdkOnce();

      const sdk = await import("@zama-fhe/relayer-sdk/web");

      // pick config export
      const baseConfig =
        (chainId === 11155111
          ? (sdk as any).SepoliaConfig ?? (sdk as any).ZamaEthereumConfig
          : (sdk as any).ZamaEthereumConfig ?? (sdk as any).SepoliaConfig);

      if (!baseConfig) {
        throw new Error(
          "Relayer SDK config not found (expected SepoliaConfig or ZamaEthereumConfig)."
        );
      }

      const inst = await (sdk as any).createInstance({
        ...baseConfig,
        network: provider,
        chainId,
        relayerUrl: "/api/relayer", // your proxy
      });

      setInstance(inst);
    } catch (e: any) {
      setInstance(undefined);
      setError(e?.message ?? String(e));
    }
  }, [enabled, provider, chainId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { instance, refresh, error };
}
