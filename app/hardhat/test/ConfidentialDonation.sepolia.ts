import { expect } from "chai";
import { ethers, fhevm, deployments } from "hardhat";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { keccak256, toUtf8Bytes } from "ethers";

describe("ConfidentialDonation (Sepolia)", function () {
  let addr: string;

  before(async function () {
    if (fhevm.isMock) {
      console.warn("Skipping Sepolia tests on mock env");
      this.skip();
    }
    const d = await deployments.get("ConfidentialDonation"); // requires hardhat-deploy
    addr = d.address;
  });

  it("encrypted donate and private per-user subtotal on Sepolia", async function () {
    this.timeout(6 * 60_000);

    const [testUser] = await ethers.getSigners();
    const app = await ethers.getContractAt("ConfidentialDonation", addr);

    // Create a round that is already started but not ended
    const roundId = keccak256(toUtf8Bytes(`sepolia-round-${Date.now()}`));
    const now = Math.floor(Date.now() / 1000);
    const startAt = now - 60;
    const endAt   = now + 3600; // 1 hour
    const goalWei64 = 10;
    const Disclosure_AfterEnd = 0;

    await (await app
      .connect(testUser)
      .createRound(roundId, await testUser.getAddress(), goalWei64, startAt, endAt, Disclosure_AfterEnd)
    ).wait();

    // testUser donates +3 (encrypted); we also send 3 wei to escrow for demo
    const e3 = await fhevm.createEncryptedInput(addr, testUser.address).add64(3).encrypt();
    await (await app
      .connect(testUser)
      .donate(roundId, e3.handles[0], e3.inputProof, { value: 3n })
    ).wait();

    // Decrypt own subtotal (allowed)
    const myHandle = await app.connect(testUser).getMyTotal(roundId);
    const myDec = await fhevm.userDecryptEuint(FhevmType.euint64, myHandle, addr, testUser);
    expect(myDec).to.eq(3n);

    // Total should not be decryptable yet (policy = AfterEnd)
    const totalHandle = await app.getTotalHandle(roundId);
    let failed = false;
    try {
      await fhevm.userDecryptEuint(FhevmType.euint64, totalHandle, addr, testUser);
    } catch {
      failed = true;
    }
    expect(failed).to.eq(true);
  });
});
