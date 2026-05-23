import { ethers } from "hardhat";

async function main() {
  const usdc = process.env.USDC_CONTRACT_ADDRESS ?? "0x3600000000000000000000000000000000000000";
  const [deployer] = await ethers.getSigners();
  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS ?? deployer.address;

  const Marketplace = await ethers.getContractFactory("EscrowMarketplace");
  const marketplace = await Marketplace.deploy(usdc, feeRecipient);
  await marketplace.waitForDeployment();

  console.log("EscrowMarketplace:", await marketplace.getAddress());
  console.log("USDC:", usdc);
  console.log("feeRecipient:", feeRecipient);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
