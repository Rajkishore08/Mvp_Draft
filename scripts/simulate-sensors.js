// Push mock IoT readings to IoTeX testnet using ethers over EVM RPC (no grpc)
require("dotenv").config();
const { ethers } = require("ethers");

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
  const rpc = process.env.IOTEX_RPC || "https://babel-api.testnet.iotex.io";
  const pk = process.env.IOTEX_PRIVATE_KEY;
  const contractAddr = process.env.IOTEX_IOTDATA_ADDRESS; // set after deploy
  if (!pk || !contractAddr) {
    console.error("Missing IOTEX_PRIVATE_KEY or IOTEX_IOTDATA_ADDRESS in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  const contract = new ethers.Contract(contractAddr, abi, wallet);
  const feeData = await provider.getFeeData();

  const devices = ["sensor-1", "sensor-2"]; // demo devices
  for (let i = 0; i < 5; i++) {
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
      await sleep(2000);
    }
  }

  console.log("Done sending mock readings.");
}

main().catch((e) => { console.error(e); process.exit(1); });
