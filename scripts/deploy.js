// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  // Deploy ERC6551Account (implementation)
  const ERC6551 = await ethers.getContractFactory("ERC6551Account");
  const erc6551Impl = await ERC6551.deploy();
  await erc6551Impl.waitForDeployment();
  console.log("ERC6551Account deployed to:", erc6551Impl.target);

  // Deploy ERC6551Registry
  const Registry = await ethers.getContractFactory("ERC6551Registry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  console.log("ERC6551Registry deployed to:", registry.target);

  // Deploy MyNFT
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy(registry.target, erc6551Impl.target);
  await myNFT.waitForDeployment();
  console.log("MyNFT deployed to:", myNFT.target);

  // Deploy SimpleStorage
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  const simpleStorage = await SimpleStorage.deploy();
  await simpleStorage.waitForDeployment();
  console.log("SimpleStorage deployed to:", simpleStorage.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
