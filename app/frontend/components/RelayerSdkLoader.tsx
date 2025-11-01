"use client";

import Script from "next/script";

export default function RelayerSdkLoader() {
  return (
    <Script
      src="/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.js"
      strategy="beforeInteractive"
      onError={(e) => {
        // This runs on the client; allowed here (not in a Server component)
        console.error("[RelayerSDK] failed to load", e);
      }}
    />
  );
}
