import { keccak256, toUtf8Bytes } from "ethers";
export const idFromSlug = (s: string) => keccak256(toUtf8Bytes(s)) as `0x${string}`;
