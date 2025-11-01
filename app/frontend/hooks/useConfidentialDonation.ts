"use client";

import { ethers } from "ethers";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  FhevmDecryptionSignature,
  type FhevmInstance,
  type GenericStringStorage,
} from "@fhevm/sdk";
import { ConfidentialDonationABI } from "@/abi/ConfidentialDonationABI";
import { ConfidentialDonationAddresses } from "@/abi/ConfidentialDonationAddresses";

type ContractInfo = {
  abi: typeof ConfidentialDonationABI.abi;
  address?: `0x${string}`;
};
function byChain(chainId?: number): ContractInfo {
  if (!chainId) return { abi: ConfidentialDonationABI.abi };
  const e = (ConfidentialDonationAddresses as any)[String(chainId)];
  if (!e?.address || e.address === ethers.ZeroAddress)
    return { abi: ConfidentialDonationABI.abi };
  return {
    abi: ConfidentialDonationABI.abi,
    address: e.address as `0x${string}`,
  };
}

export type RoundView = {
  owner: string;
  beneficiary: string;
  goalWei64: bigint;
  startAt: bigint;
  endAt: bigint;
  policy: number;
  escrow: bigint;
  raised: bigint;
  paidOut: boolean;
  totalPublicUnlocked: boolean;
  title: string;
  description: string;
};

function eqRound(a?: RoundView, b?: RoundView) {
  if (!a || !b) return false;
  return (
    a.owner === b.owner &&
    a.beneficiary === b.beneficiary &&
    a.goalWei64 === b.goalWei64 &&
    a.startAt === b.startAt &&
    a.endAt === b.endAt &&
    a.policy === b.policy &&
    a.escrow === b.escrow &&
    a.totalPublicUnlocked === b.totalPublicUnlocked &&
    a.title === b.title &&
    a.description === b.description
  );
}

function friendly(e: any): string {
  const raw = (e?.reason ||
    e?.shortMessage ||
    e?.error?.message ||
    e?.message ||
    "") as string;
  if (/missing revert data/i.test(raw))
    return "Unable to read from contract. Check network and address.";
  if (/execution reverted/i.test(raw) && !/reason/i.test(raw))
    return "Transaction reverted.";
  if (/not started/i.test(raw)) return "Donation not started yet.";
  if (/not ended/i.test(raw)) return "Round has not ended yet.";
  if (/ended/i.test(raw)) return "This round has ended.";
  if (/round not found/i.test(raw)) return "Round not found.";
  if (/not round owner/i.test(raw))
    return "Only the round owner can perform this action.";
  if (/policy:\s*never/i.test(raw))
    return "Totals are never revealed for this round.";
  if (/after end & goal/i.test(raw))
    return "Totals reveal after end time AND meeting the goal.";
  if (/after end/i.test(raw)) return "Totals reveal after end time.";
  return raw.replace(/^execution reverted:\s*/i, "") || "Transaction error.";
}

// --- NEW: util to ensure contract code exists ---
async function hasCode(provider: any, address?: string) {
  if (!provider || !address) return false;
  try {
    const code = await provider.getCode(address);
    return code && code !== "0x" && code !== "0x0";
  } catch {
    return false;
  }
}

export function useConfidentialDonation({
  instance,
  storage,
  chainId,
  ethersSigner,
  ethersReadonlyProvider,
}: {
  instance: FhevmInstance | undefined;
  storage: GenericStringStorage;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
}) {
  const [message, setMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [roundIds, setRoundIds] = useState<`0x${string}`[]>([]);
  const [roundsMap, setRoundsMap] = useState<Record<string, RoundView>>({});
  const [totalHandles, setTotalHandles] = useState<Record<string, string>>({});
  const [myHandles, setMyHandles] = useState<Record<string, string>>({});
  const [decTotals, setDecTotals] = useState<Record<string, bigint>>({});
  const [decMines, setDecMines] = useState<Record<string, bigint>>({});
  const [currentAddress, setCurrentAddress] = useState<string | undefined>();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const addr = ethersSigner ? await ethersSigner.getAddress() : undefined;
        if (alive) setCurrentAddress(addr);
      } catch {
        if (alive) setCurrentAddress(undefined);
      }
    })();
    return () => {
      alive = false;
    };
  }, [ethersSigner]);

  const info = useMemo(() => byChain(chainId), [chainId]);

  const ro = useMemo(
    () =>
      info.address && ethersReadonlyProvider
        ? new ethers.Contract(info.address, info.abi, ethersReadonlyProvider)
        : null,
    [info.address, info.abi, ethersReadonlyProvider]
  );
  const rw = useMemo(
    () =>
      info.address && ethersSigner
        ? new ethers.Contract(info.address, info.abi, ethersSigner)
        : null,
    [info.address, info.abi, ethersSigner]
  );

  const isDeployed = useMemo(
    () => Boolean(info.address) && info.address !== ethers.ZeroAddress,
    [info.address]
  );
  const canRead = useMemo(() => Boolean(ro), [ro]);
  const canWrite = useMemo(
    () => Boolean(rw && ethersSigner && !isWorking),
    [rw, ethersSigner, isWorking]
  );
  const canEncrypt = useMemo(
    () => Boolean(rw && instance && ethersSigner && !isWorking),
    [rw, instance, ethersSigner, isWorking]
  );

  const refreshingRef = useRef(false);

  const listAll = useCallback(async () => {
    if (!ro || !info.address) return;
    try {
      // --- guard: contract code must exist ---
      const providerRO = ethersReadonlyProvider as any;
      const ok = await hasCode(providerRO, info.address);
      if (!ok) {
        setRoundIds([]);
        setRoundsMap({});
        setMessage("Contract not deployed on this chain.");
        return;
      }
      const ids = (await ro.getAllRoundIds()) as `0x${string}`[];
      setRoundIds((prev) =>
        ids.length === prev.length && ids.every((id, i) => id === prev[i])
          ? prev
          : ids
      );
    } catch (e: any) {
      setMessage(`List failed: ${friendly(e)}`);
    }
  }, [ro, info.address, ethersReadonlyProvider]);

  const readRound = useCallback(
    async (roundId: `0x${string}`) => {
      if (!ro || !info.address) return;
      if (!refreshingRef.current) {
        refreshingRef.current = true;
        setIsRefreshing(true);
      }
      try {
        // --- guard: contract code must exist ---
        const providerRO = ethersReadonlyProvider as any;
        const ok = await hasCode(providerRO, info.address);
        if (!ok) {
          setMessage("Contract not deployed on this chain.");
          return;
        }

        const r = await ro.getRound(roundId);
        const view: RoundView = {
          owner: r[0],
          beneficiary: r[1],
          goalWei64: BigInt(r[2]),
          startAt: BigInt(r[3]),
          endAt: BigInt(r[4]),
          policy: Number(r[5]),
          escrow: BigInt(r[6]),
          raised: BigInt(r[7]),
          paidOut: Boolean(r[8]),
          totalPublicUnlocked: Boolean(r[9]),
          title: r[10],
          description: r[11],
        };
        setRoundsMap((m) =>
          eqRound(m[roundId], view) ? m : { ...m, [roundId]: view }
        );

        const [tot, mine] = (await Promise.all([
          ro.getTotalHandle(roundId),
          rw
            ? rw.getMyTotal(roundId)
            : Promise.resolve(ethers.ZeroHash as string),
        ])) as [string, string];

        let changed = false;
        setTotalHandles((m) => {
          if (m[roundId] === tot) return m;
          changed = true;
          return { ...m, [roundId]: tot };
        });
        setMyHandles((m) => {
          if (m[roundId] === mine) return m;
          changed = true;
          return { ...m, [roundId]: mine };
        });

        if (changed) {
          setDecTotals((m) => {
            if (m[roundId] === undefined) return m;
            const { [roundId]: _, ...rest } = m;
            return rest;
          });
          setDecMines((m) => {
            if (m[roundId] === undefined) return m;
            const { [roundId]: _, ...rest } = m;
            return rest;
          });
        }
      } catch (e: any) {
        setMessage(`Read failed: ${friendly(e)}`);
      } finally {
        refreshingRef.current = false;
        setIsRefreshing(false);
      }
    },
    [ro, rw, info.address, ethersReadonlyProvider]
  );

  const createRound = useCallback(
    async (args: {
      roundId: `0x${string}`;
      beneficiary: `0x${string}`;
      goalWei64: bigint;
      startAt: bigint;
      endAt: bigint;
      policy: number;
      title: string;
      description: string;
    }) => {
      if (!rw) {
        setMessage("Wallet not connected.");
        return;
      }
      setIsWorking(true);
      try {
        const tx = await rw.createRound(
          args.roundId,
          args.beneficiary,
          args.goalWei64,
          args.startAt,
          args.endAt,
          args.policy,
          args.title,
          args.description
        );
        await tx.wait();
        setMessage("Round created.");
        await listAll();
        await readRound(args.roundId);
      } catch (e: any) {
        setMessage(`Create failed: ${friendly(e)}`);
      } finally {
        setIsWorking(false);
      }
    },
    [rw, listAll, readRound]
  );

  const donate = useCallback(
    async (roundId: `0x${string}`, amountWei: bigint) => {
      if (!rw) {
        setMessage("Wallet not connected.");
        return;
      }
      if (!instance) {
        setMessage("FHE not initialized yet.");
        return;
      }
      if (!ethersSigner || !info.address) {
        setMessage("Signer unavailable.");
        return;
      }
      setIsWorking(true);
      try {
        // time window sanity
        if (ro) {
          const r = await ro.getRound(roundId);
          const now = Math.floor(Date.now() / 1000);
          if (now < Number(r[3])) {
            setMessage("Donation not started yet.");
            return;
          }
          if (now > Number(r[4])) {
            setMessage("This round has ended.");
            return;
          }
        }

        setMessage("Encrypting & donating…");
        const user = await ethersSigner.getAddress();
        const input = instance.createEncryptedInput(info.address, user);
        input.add64(amountWei); // store WEI
        const enc = await input.encrypt();

        const tx = await rw.donate(roundId, enc.handles[0], enc.inputProof, {
          value: amountWei,
        });
        await tx.wait();

        setMessage("Donation submitted.");
        await readRound(roundId);

        const handle = myHandles[roundId];
        if (handle && handle !== ethers.ZeroHash) {
          const sig = await FhevmDecryptionSignature.loadOrSign(
            instance,
            [info.address],
            ethersSigner,
            storage
          );
          if (sig) {
            const res = await instance.userDecrypt(
              [{ handle, contractAddress: info.address }],
              sig.privateKey,
              sig.publicKey,
              sig.signature,
              sig.contractAddresses,
              sig.userAddress,
              sig.startTimestamp,
              sig.durationDays
            );
            setDecMines((m) => ({ ...m, [roundId]: res[handle] as bigint }));
          }
        }
      } catch (e: any) {
        setMessage(`Donate failed: ${friendly(e)}`);
      } finally {
        setIsWorking(false);
      }
    },
    [
      rw,
      instance,
      ethersSigner,
      info.address,
      ro,
      readRound,
      myHandles,
      storage,
    ]
  );

  const maybeMakeTotalPublic = useCallback(
    async (roundId: `0x${string}`) => {
      if (!rw) {
        setMessage("Wallet not connected.");
        return;
      }
      setIsWorking(true);
      try {
        const tx = await rw.maybeMakeTotalPublic(roundId);
        await tx.wait();
        setMessage("Total made public.");
        await readRound(roundId);
      } catch (e: any) {
        setMessage(`Unlock failed: ${friendly(e)}`);
      } finally {
        setIsWorking(false);
      }
    },
    [rw, readRound]
  );

  const payout = useCallback(
    async (roundId: `0x${string}`) => {
      if (!rw) {
        setMessage("Wallet not connected.");
        return;
      }
      setIsWorking(true);
      try {
        const tx = await rw.payout(roundId);
        await tx.wait();
        setMessage("Payout complete.");
        await readRound(roundId);
      } catch (e: any) {
        setMessage(`Payout failed: ${friendly(e)}`);
      } finally {
        setIsWorking(false);
      }
    },
    [rw, readRound]
  );

  const decrypt = useCallback(
    async (which: "mine" | "total", roundId: `0x${string}`) => {
      if (!info.address || !instance || !ethersSigner) {
        setMessage("FHE not initialized yet.");
        return;
      }
      const handle =
        which === "mine" ? myHandles[roundId] : totalHandles[roundId];
      if (!handle) return;

      if (handle === ethers.ZeroHash) {
        if (which === "mine") setDecMines((m) => ({ ...m, [roundId]: 0n }));
        else setDecTotals((m) => ({ ...m, [roundId]: 0n }));
        setMessage(`${which}=0`);
        return;
      }

      setIsWorking(true);
      try {
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [info.address],
          ethersSigner,
          storage
        );
        if (!sig) throw new Error("Decryption signature unavailable");

        const res = await instance.userDecrypt(
          [{ handle, contractAddress: info.address }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );
        const clear = res[handle] as bigint;
        if (which === "mine") setDecMines((m) => ({ ...m, [roundId]: clear }));
        else setDecTotals((m) => ({ ...m, [roundId]: clear }));
        setMessage(`${which}=${clear.toString()}`);
      } catch (e: any) {
        setMessage(`Decrypt ${which} failed: ${friendly(e)}`);
      } finally {
        setIsWorking(false);
      }
    },
    [info.address, instance, ethersSigner, storage, myHandles, totalHandles]
  );

  const isOwner = useCallback(
    (rid: `0x${string}`) => {
      const o = roundsMap[rid]?.owner;
      if (!o || !currentAddress) return false;
      return o.toLowerCase() === currentAddress.toLowerCase();
    },
    [roundsMap, currentAddress]
  );

  return {
    isDeployed,
    canRead,
    canWrite,
    canEncrypt,
    isWorking,
    isRefreshing,
    message,
    currentAddress,
    rounds: roundIds,
    roundsMap,
    totalHandles,
    myHandles,
    decTotals,
    decMines,
    listAll,
    readRound,
    createRound,
    donate,
    decryptMine: (rid: `0x${string}`) => decrypt("mine", rid),
    decryptTotal: (rid: `0x${string}`) => decrypt("total", rid),
    maybeMakeTotalPublic,
    payout,
    isOwner,
  };
}
