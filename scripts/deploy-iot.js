const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  const signers = await ethers.getSigners();
  if (!signers.length) {
    throw new Error("No signer available. Set IOTEX_PRIVATE_KEY in .env and try again.");
  }
  const [deployer] = signers;
  console.log("Deploying IoTData with:", deployer.address, "on network:", hre.network.name);
  const IoTData = await ethers.getContractFactory("IoTData");
  const iot = await IoTData.deploy();
  await iot.waitForDeployment();
  const addr = iot.target;
  console.log("IoTData deployed to:", addr);

  const outDir = path.join(__dirname, "..", "artifacts-addresses");
  try { fs.mkdirSync(outDir, { recursive: true }); } catch (_) {}
  const outFile = path.join(outDir, `iotdata-${hre.network.name}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ address: addr }, null, 2));
  console.log("Saved address to:", outFile);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
