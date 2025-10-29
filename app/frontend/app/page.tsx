"use client";

import { useFhevm } from "@fhevm/react";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

export default function Page() {
  const { provider, chainId, initialMockChains } = useMetaMaskEthersSigner();

  const { instance } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  return (
    <div className="grid gap-4 mx-4">
      
    </div>
  );
}
