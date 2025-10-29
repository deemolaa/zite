"use client";

import { ethers } from "ethers";
import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { FhevmDecryptionSignature, type FhevmInstance, type GenericStringStorage } from "./fhevm-react";
import { ConfidentialDonationABI } from "@/abi/ConfidentialDonationABI";
import { ConfidentialDonationAddresses } from "@/abi/ConfidentialDonationAddresses";

type ContractInfo = {
  abi: typeof ConfidentialDonationABI.abi;
  address?: `0x${string}`;
};

function byChain(chainId?: number): ContractInfo {
  if (!chainId) return { abi: ConfidentialDonationABI.abi };
  const e = (ConfidentialDonationAddresses as any)[String(chainId)];
  if (!e?.address || e.address === ethers.ZeroAddress) return { abi: ConfidentialDonationABI.abi };
  return { abi: ConfidentialDonationABI.abi, address: e.address as `0x${string}` };
}

export function useImpactPools({
  instance, storage, chainId, ethersSigner, ethersReadonlyProvider,
  sameChain, sameSigner
}: {
  instance: FhevmInstance | undefined;
  storage: GenericStringStorage;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: React.RefObject<(cid: number | undefined) => boolean>;
  sameSigner: React.RefObject<(s: ethers.JsonRpcSigner | undefined) => boolean>;
}) {
  const [message, setMessage] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalHandle, setTotalHandle] = useState<string | undefined>();
  const [myHandle, setMyHandle] = useState<string | undefined>();
  const [decTotal, setDecTotal] = useState<bigint | undefined>();
  const [decMine, setDecMine] = useState<bigint | undefined>();
  const [round, setRound] = useState<any | undefined>();

  const info = useMemo(() => byChain(chainId), [chainId]);
  const infoRef = useRef(info);
  useEffect(() => { infoRef.current = info; }, [info]);
  const workingRef = useRef(false);
  const refreshingRef = useRef(false);

  const isDeployed = useMemo(() => Boolean(info.address) && info.address !== ethers.ZeroAddress, [info.address]);
  const canInteract = useMemo(() => Boolean(info.address && instance && ethersSigner && !isWorking), [info.address, instance, ethersSigner, isWorking]);

  const getContractRO = useCallback(() => {
    if (!info.address || !ethersReadonlyProvider) return null;
    return new ethers.Contract(info.address, info.abi, ethersReadonlyProvider);
  }, [info.address, info.abi, ethersReadonlyProvider]);

  const getContractRW = useCallback(() => {
    if (!info.address || !ethersSigner) return null;
    return new ethers.Contract(info.address, info.abi, ethersSigner);
  }, [info.address, info.abi, ethersSigner]);

  const refreshRound = useCallback(async (roundId: `0x${string}`) => {
    if (refreshingRef.current) return;
    if (!info.address || !ethersReadonlyProvider) return;

    refreshingRef.current = true;
    setIsRefreshing(true);
    setMessage("");

    try {
      const ro = getContractRO()!;
      const rw = getContractRW();
      const r = await ro.getRound(roundId);
      setRound(r);

      const totalP = ro.getTotalHandle(roundId);
      const mineP  = rw ? rw.getMySubtotalHandle(roundId) : Promise.resolve(ethers.ZeroHash as unknown as string);

      const [tot, mine] = await Promise.all([totalP, mineP]) as [string, string];
      setTotalHandle(tot);
      setMyHandle(mine);
      setDecTotal(undefined);
      setDecMine(undefined);
    } catch (e:any) {
      setMessage(e?.message ?? String(e));
    } finally {
      refreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [getContractRO, getContractRW, info.address, ethersReadonlyProvider]);

  const createRound = useCallback(async (args: {
    roundId: `0x${string}`;
    beneficiary: `0x${string}`;
    goalWei64: bigint;
    startAt: number;
    endAt: number;
    policy: number; // 0 AfterEnd, 1 AfterEndAndGoal, 2 Never
  }) => {
    if (!canInteract) return;
    setIsWorking(true); workingRef.current = true;
    try {
      const rw = getContractRW()!;
      const tx = await rw.createRound(args.roundId, args.beneficiary, Number(args.goalWei64), args.startAt, args.endAt, args.policy);
      await tx.wait();
      setMessage("Round created");
    } catch (e:any) {
      setMessage(`Create failed: ${e?.message ?? e}`);
    } finally {
      setIsWorking(false); workingRef.current = false;
    }
  }, [canInteract, getContractRW]);

  const donate = useCallback(async (roundId: `0x${string}`, amountWei: bigint) => {
    if (!canInteract || !instance || !ethersSigner) return;
    setIsWorking(true); workingRef.current = true;
    setMessage("Encrypting & donating…");

    try {
      const user = await ethersSigner.getAddress();
      const input = instance.createEncryptedInput(info.address!, user);
      input.add64(amountWei); // donate amount (wei) into ciphertext
      const enc = await input.encrypt();

      const rw = getContractRW()!;
      const tx = await rw.donate(roundId, enc.handles[0], enc.inputProof, { value: amountWei });
      await tx.wait();

      setMessage("Donation submitted");
      await refreshRound(roundId);
      await decrypt("mine", roundId);
    } catch (e:any) {
      setMessage(`Donate failed: ${e?.message ?? e}`);
    } finally {
      setIsWorking(false); workingRef.current = false;
    }
  }, [canInteract, instance, ethersSigner, getContractRW, info.address, refreshRound]);

  const maybeMakeTotalPublic = useCallback(async (roundId: `0x${string}`) => {
    if (!canInteract) return;
    setIsWorking(true); workingRef.current = true;
    try {
      const rw = getContractRW()!;
      const tx = await rw.maybeMakeTotalPublic(roundId);
      await tx.wait();
      setMessage("Total made public");
      await refreshRound(roundId);
    } catch (e:any) {
      setMessage(`Unlock failed: ${e?.message ?? e}`);
    } finally {
      setIsWorking(false); workingRef.current = false;
    }
  }, [canInteract, getContractRW, refreshRound]);

  const payout = useCallback(async (roundId: `0x${string}`) => {
    if (!canInteract) return;
    setIsWorking(true); workingRef.current = true;
    try {
      const rw = getContractRW()!;
      const tx = await rw.payout(roundId);
      await tx.wait();
      setMessage("Payout complete");
      await refreshRound(roundId);
    } catch (e:any) {
      setMessage(`Payout failed: ${e?.message ?? e}`);
    } finally {
      setIsWorking(false); workingRef.current = false;
    }
  }, [canInteract, getContractRW, refreshRound]);

  const decrypt = useCallback(async (which: "mine" | "total", roundId: `0x${string}`) => {
    if (!info.address || !instance || !ethersSigner) return;
    const handle = which === "mine" ? myHandle : totalHandle;
    if (!handle) return;

    if (handle === ethers.ZeroHash) {
      if (which === "mine") setDecMine(0n); else setDecTotal(0n);
      setMessage(`${which}=0`);
      return;
    }

    setIsWorking(true); workingRef.current = true;
    try {
      const sig = await FhevmDecryptionSignature.loadOrSign(instance, [info.address], ethersSigner, storage);
      if (!sig) throw new Error("No decryption signature");

      const res = await instance.userDecrypt(
        [{ handle, contractAddress: info.address! }],
        sig.privateKey, sig.publicKey, sig.signature,
        sig.contractAddresses, sig.userAddress, sig.startTimestamp, sig.durationDays
      );

      const clear = res[handle] as bigint;
      if (which === "mine") setDecMine(clear); else setDecTotal(clear);
      setMessage(`${which}=${clear.toString()}`);
    } catch (e:any) {
      setMessage(`Decrypt ${which} failed: ${e?.message ?? e}`);
    } finally {
      setIsWorking(false); workingRef.current = false;
    }
  }, [info.address, instance, ethersSigner, storage, myHandle, totalHandle]);

  return {
    isDeployed,
    canInteract,
    isWorking,
    isRefreshing,
    message,
    round,
    totalHandle,
    myHandle,
    decTotal,
    decMine,

    refreshRound,
    createRound,
    donate,
    decryptMine: (rid: `0x${string}`) => decrypt("mine", rid),
    decryptTotal: (rid: `0x${string}`) => decrypt("total", rid),
    maybeMakeTotalPublic,
    payout,
  };
}
