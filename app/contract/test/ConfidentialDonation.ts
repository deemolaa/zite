import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { keccak256, toUtf8Bytes } from "ethers";

const ZERO = /^0x0{64}$/;

describe("ConfidentialDonation (local/mock)", function () {
  before(function () {
    if (!fhevm.isMock) { 
      console.warn("Skipping local/mock tests on non-mock env");
      this.skip();
    }
  });

  const poolId = keccak256(toUtf8Bytes("round-1"));

  it("deploys & totals start zero", async () => {
    const f = await ethers.getContractFactory("ConfidentialDonation");
    const app = await f.deploy();
    const h = await app.getTotalHandle(poolId);
    expect(ZERO.test(h)).to.eq(true);
  });

  it("adds encrypted donations & only donor can decrypt their own sum", async () => {
    const [owner, a, b] = await ethers.getSigners();
    const f = await ethers.getContractFactory("ConfidentialDonation");
    const app = await f.deploy();
    const addr = await app.getAddress();

    // --- create the round first ---
    const now = Math.floor(Date.now() / 1000);
    const startAt = now - 5;       // already started
    const endAt   = now + 3600;    // ends in 1h
    const goalWei64 = 8;           // small goal for demo
    const Disclosure_AfterEnd = 0 
    await app.connect(owner).createRound(
        poolId,
        await owner.getAddress(),
        goalWei64,
        startAt,
        endAt,
        Disclosure_AfterEnd
    );

    // A donates +3 (encrypted)
    let enc = await fhevm.createEncryptedInput(addr, a.address).add64(3).encrypt();
    await (await app.connect(a).donate(poolId, enc.handles[0], enc.inputProof, { value: 3n })).wait();

    // B donates +5 (encrypted)
    enc = await fhevm.createEncryptedInput(addr, b.address).add64(5).encrypt();
    await (await app.connect(b).donate(poolId, enc.handles[0], enc.inputProof, { value: 5n })).wait();

    // Total handle exists but isn't decryptable by random users
    const hTot = await app.getTotalHandle(poolId);

    // A or B attempts to decrypt total
    let failed = false;
    try { await fhevm.userDecryptEuint(FhevmType.euint64, hTot, addr, a); } catch { failed = true; }
    expect(failed).to.eq(true);

    // A's personal tally
    const mineA = await app.connect(a).getMyTotal(poolId);
    const decA  = await fhevm.userDecryptEuint(FhevmType.euint64, mineA, addr, a);
    expect(decA).to.eq(3);

    // B cannot decrypt A’s tally
    failed = false;
    try { await fhevm.userDecryptEuint(FhevmType.euint64, mineA, addr, b); } catch { failed = true; }
    expect(failed).to.eq(true);
  });
});
