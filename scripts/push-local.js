const hre = require("hardhat");
const { ethers } = hre;
const fs = require("fs");
const path = require("path");

async function main() {
  const net = hre.network.name;
  const file = path.join(__dirname, "..", "artifacts-addresses", `iotdata-${net}.json`);
  if (!fs.existsSync(file)) throw new Error(`Address file not found: ${file}. Deploy first.`);
  const { address } = JSON.parse(fs.readFileSync(file, "utf8"));

  const [signer] = await ethers.getSigners();
  console.log("Using signer:", signer.address, "network:", net);
  const iot = await ethers.getContractAt("IoTData", address, signer);
  const deviceId = process.argv[2] || "sensor-1";
  const reading = JSON.stringify({ temp: 25.1, humidity: 51.2, note: "local" });
  const ts = Math.floor(Date.now() / 1000);
  const tx = await iot.storeReading(deviceId, reading, ts);
  const rc = await tx.wait();
  console.log("Pushed reading tx:", rc.hash);
}

main().catch((e) => { console.error(e); process.exit(1); });
