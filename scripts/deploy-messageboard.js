const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const signers = await ethers.getSigners();
  if (!signers.length) {
    throw new Error("No signer available. Set IOTEX_PRIVATE_KEY in .env and try again.");
  }
  const [deployer] = signers;
  console.log("Deploying MessageBoard with:", deployer.address, "on:", hre.network.name);
  const MessageBoard = await ethers.getContractFactory("MessageBoard");
  const contract = await MessageBoard.deploy();
  await contract.waitForDeployment();
  console.log("MessageBoard deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
