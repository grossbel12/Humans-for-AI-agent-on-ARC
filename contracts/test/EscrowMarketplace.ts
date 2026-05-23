import { expect } from "chai";
import { ethers, network } from "hardhat";

const usdc = (n: number) => BigInt(n) * 1_000_000n;
const hash = "0x" + "11".repeat(32);
const proof = "0x" + "22".repeat(32);

describe("EscrowMarketplace", function () {
  async function deploy() {
    const [owner, employer, executor, feeRecipient] = await ethers.getSigners();
    const USDC = await ethers.getContractFactory("MockUSDC");
    const token = await USDC.deploy();
    const Market = await ethers.getContractFactory("EscrowMarketplace");
    const market = await Market.deploy(await token.getAddress(), feeRecipient.address);
    await token.mint(employer.address, usdc(100));
    await token.connect(employer).approve(await market.getAddress(), usdc(100));
    return { owner, employer, executor, feeRecipient, token, market };
  }

  it("creates, accepts, proves, and pays", async () => {
    const { employer, executor, feeRecipient, token, market } = await deploy();
    const deadline = Math.floor(Date.now() / 1000) + 7200;
    await market.connect(employer).createTask(executor.address, usdc(10), deadline, hash);
    await market.connect(executor).acceptTask(1);
    await market.connect(executor).submitProof(1, proof);
    await expect(market.connect(employer).confirmCompletion(1)).to.emit(market, "TaskCompleted");
    expect(await token.balanceOf(executor.address)).to.equal(usdc(9) + 500_000n);
    expect(await token.balanceOf(feeRecipient.address)).to.equal(500_000n);
    expect(await market.reputation(executor.address)).to.equal(10);
  });

  it("refunds open task on cancel", async () => {
    const { employer, executor, token, market } = await deploy();
    const deadline = Math.floor(Date.now() / 1000) + 7200;
    await market.connect(employer).createTask(executor.address, usdc(5), deadline, hash);
    await market.connect(employer).cancelOpenTask(1);
    expect(await token.balanceOf(employer.address)).to.equal(usdc(100));
  });

  it("resolves dispute for employer", async () => {
    const { owner, employer, executor, token, market } = await deploy();
    const deadline = Math.floor(Date.now() / 1000) + 7200;
    await market.connect(employer).createTask(executor.address, usdc(5), deadline, hash);
    await market.connect(executor).acceptTask(1);
    await market.connect(executor).submitProof(1, proof);
    await market.connect(employer).openDispute(1);
    await market.connect(owner).resolveDispute(1, false);
    expect(await token.balanceOf(employer.address)).to.equal(usdc(100));
  });

  it("auto releases after grace window", async () => {
    const { employer, executor, token, market } = await deploy();
    const deadline = Math.floor(Date.now() / 1000) + 7200;
    await market.connect(employer).createTask(executor.address, usdc(2), deadline, hash);
    await market.connect(executor).acceptTask(1);
    await market.connect(executor).submitProof(1, proof);
    await network.provider.send("evm_setNextBlockTimestamp", [deadline + 86401]);
    await market.autoRelease(1);
    expect(await token.balanceOf(executor.address)).to.equal(1_900_000n);
  });
});
