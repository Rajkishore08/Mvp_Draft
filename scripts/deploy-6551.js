// Deploy ERC-6551 Registry, Account implementation, and MyNFT
require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  console.log(`Network: ${network}`);
  console.log(`Deployer: ${deployer.address}`);

  const Registry = await hre.ethers.getContractFactory("ERC6551Registry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  const registryAddr = await registry.getAddress();
  console.log("ERC6551Registry:", registryAddr);

  const Account = await hre.ethers.getContractFactory("ERC6551Account");
  const accountImpl = await Account.deploy();
  await accountImpl.waitForDeployment();
  const accountImplAddr = await accountImpl.getAddress();
  console.log("ERC6551Account Impl:", accountImplAddr);

  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const myNFT = await MyNFT.deploy(registryAddr, accountImplAddr);
  await myNFT.waitForDeployment();
  const myNFTAddr = await myNFT.getAddress();
  console.log("MyNFT:", myNFTAddr);

  // Save addresses
  const outDir = path.join(__dirname, "..", "artifacts-addresses");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `erc6551-${network}.json`);
  fs.writeFileSync(outPath, JSON.stringify({ registry: registryAddr, accountImpl: accountImplAddr, myNFT: myNFTAddr }, null, 2));
  console.log("Saved:", outPath);
}

main().catch((e) => { console.error(e); process.exit(1); });
