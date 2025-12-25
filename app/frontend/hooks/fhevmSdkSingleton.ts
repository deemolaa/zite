let initPromise: Promise<void> | null = null;

export function initFhevmSdkOnce() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const sdk = await import("@zama-fhe/relayer-sdk/web");

    // Prefer LOCAL wasm to avoid any CDN/CORS flakiness
    // You MUST place these files in /public (see step 2 below)
    await sdk.initSDK();
  })();

  return initPromise;
}
