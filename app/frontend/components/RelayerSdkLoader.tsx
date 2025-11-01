"use client";

import Script from "next/script";

export default function RelayerSdkLoader() {
  return (
    <Script
    id="zama-relayer-sdk"
      src="https://cdn.zama.org/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs"
      strategy="afterInteractive"
      onError={(e) => console.warn("[RelayerSDK] failed to load", e)}
    />
  );
}
