require("dotenv").config();
const { ethers } = require("ethers");

const abi = [
  {
    inputs: [ { internalType: "string", name: "deviceId", type: "string" } ],
    name: "latestReading",
    outputs: [
      { internalType: "bool", name: "exists", type: "bool" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
      { internalType: "string", name: "reading", type: "string" },
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "uint256", name: "count", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "string", name: "deviceId", type: "string" },
      { internalType: "uint256", name: "n", type: "uint256" }
    ],
    name: "lastNReadings",
    outputs: [
      { internalType: "uint256[]", name: "timestamps", type: "uint256[]" },
      { internalType: "string[]", name: "readings", type: "string[]" },
      { internalType: "address[]", name: "senders", type: "address[]" }
    ],
    stateMutability: "view",
    type: "function"
  }
];

async function main() {
  const rpc = process.env.IOTEX_RPC || "https://babel-api.testnet.iotex.io";
  const contractAddr = process.env.IOTEX_IOTDATA_ADDRESS;
  const deviceId = process.argv[2] || "sensor-1";
  const n = Number(process.argv[3] || 3);
  if (!contractAddr) {
    console.error("Set IOTEX_IOTDATA_ADDRESS in .env");
    process.exit(1);
  }
  const provider = new ethers.JsonRpcProvider(rpc);
  const net = await provider.getNetwork();
  const c = new ethers.Contract(contractAddr, abi, provider);
  console.log(`Connected to chainId=${net.chainId} rpc=${rpc}`);
  const latest = await c.latestReading(deviceId);
  console.log("latestReading", { deviceId, exists: latest[0], timestamp: Number(latest[1]), reading: latest[2], sender: latest[3], count: Number(latest[4]) });
  const lastN = await c.lastNReadings(deviceId, n);
  const out = [];
  for (let i = 0; i < lastN[0].length; i++) {
    out.push({ ts: Number(lastN[0][i]), reading: lastN[1][i], sender: lastN[2][i] });
  }
  console.log(`lastNReadings (${n})`, out);
}

main().catch((e) => { console.error(e); process.exit(1); });
