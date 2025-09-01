// Push mock IoT readings to IoTeX testnet using ethers over EVM RPC (no grpc)
require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const abi = [
  {
    inputs: [
      { internalType: "string", name: "deviceId", type: "string" },
      { internalType: "string", name: "reading", type: "string" },
      { internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "storeReading",
    outputs: [ { internalType: "uint256", name: "index", type: "uint256" } ],
    stateMutability: "nonpayable",
    type: "function"
  }
];

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  let rpc = process.env.IOTEX_RPC || "https://babel-api.testnet.iotex.io";
  let pk = process.env.IOTEX_PRIVATE_KEY;
  let contractAddr = process.env.IOTEX_IOTDATA_ADDRESS; // set after deploy
  // Local fallback for convenience
  if (!contractAddr) {
    try {
      const p = path.join(__dirname, "..", "artifacts-addresses", "iotdata-localhost.json");
      if (fs.existsSync(p)) {
        const j = JSON.parse(fs.readFileSync(p, "utf8"));
        contractAddr = j.address || j.iotData || j.IoTData || j.contract;
        rpc = process.env.IOTEX_RPC || "http://127.0.0.1:8545";
        console.log(`[SIM] Using local IoTData at ${contractAddr} with RPC ${rpc}`);
      }
    } catch (_) {}
  }
  if (!contractAddr) {
    console.error("IOTEX_IOTDATA_ADDRESS not set and no local fallback found.");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  let signer;
  if (pk) {
    signer = new ethers.Wallet(pk, provider);
  } else if (/127\.0\.0\.1|localhost/.test(rpc)) {
    // Impersonate first local account to make it easy
    const accounts = await provider.send("eth_accounts", []);
    const acct = accounts[0];
    await provider.send("hardhat_impersonateAccount", [acct]);
    signer = await provider.getSigner(acct);
    console.log(`[SIM] Impersonating ${acct} on localhost`);
  } else {
    console.error("No signer available. Set IOTEX_PRIVATE_KEY in .env.");
    process.exit(1);
  }
  const contract = new ethers.Contract(contractAddr, abi, signer);
  const feeData = await provider.getFeeData();

  // Sensors and iterations can be customized via env
  const SENSORS = (process.env.SENSORS || "sensor-1,sensor-2,sensor-3,sensor-4,sensor-5").split(/[,\s]+/).filter(Boolean);
  const ITER = Number(process.env.ITERATIONS || 5);
  const INTERVAL = Number(process.env.INTERVAL_MS || 1200);

  const devices = SENSORS;
  for (let i = 0; i < ITER; i++) {
    for (const d of devices) {
      const reading = JSON.stringify({ temp: 20 + Math.random() * 10, humidity: 40 + Math.random() * 20 });
      const ts = Math.floor(Date.now() / 1000);
      try {
        // Use suggested gasPrice if available to avoid under/over-paying issues
        const tx = await contract.storeReading(d, reading, ts, {
          gasLimit: 200000,
          ...(feeData.gasPrice ? { gasPrice: feeData.gasPrice } : {})
        });
        const r = await tx.wait();
        console.log(`Sent reading ${d} -> tx ${r.hash}`);
      } catch (err) {
        console.error("send error", err.message || err);
      }
      await sleep(INTERVAL);
    }
  }

  console.log("Done sending mock readings.");
}

main().catch((e) => { console.error(e); process.exit(1); });
