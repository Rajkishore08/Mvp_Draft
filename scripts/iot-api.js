require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");

const abi = [
  {
    inputs: [ { internalType: "string", name: "deviceId", type: "string" } ],
    name: "getDeviceBinding",
    outputs: [
      { internalType: "address", name: "nft", type: "address" },
      { internalType: "uint256", name: "tokenId", type: "uint256" },
      { internalType: "address", name: "account", type: "address" }
    ],
    stateMutability: "view",
    type: "function"
  },
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

const app = express();
app.use(cors());

let rpc = process.env.IOTEX_RPC || "https://babel-api.testnet.iotex.io";
let addr = process.env.IOTEX_IOTDATA_ADDRESS;
if (!addr) {
  // Try local fallback
  try {
    const fs = require("fs");
    const path = require("path");
    const p = path.join(__dirname, "..", "artifacts-addresses", "iotdata-localhost.json");
    if (fs.existsSync(p)) {
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      addr = j.address || j.iotData || j.IoTData || j.contract;
      rpc = process.env.IOTEX_RPC || "http://127.0.0.1:8545";
      console.log(`[API] Using local IoTData at ${addr} with RPC ${rpc}`);
    }
  } catch (_) {}
}
if (!addr) {
  console.error("IOTEX_IOTDATA_ADDRESS not set and no local fallback found. Set it in .env or deploy locally.");
}
const provider = new ethers.JsonRpcProvider(rpc);
const contract = addr ? new ethers.Contract(addr, abi, provider) : null;

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/latest", async (req, res) => {
  try {
    const deviceId = req.query.deviceId || "sensor-1";
    if (!contract) throw new Error("Contract not configured");
    const r = await contract.latestReading(deviceId);
    res.json({ deviceId, exists: r[0], timestamp: Number(r[1]), reading: r[2], sender: r[3], count: Number(r[4]) });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

app.get("/last", async (req, res) => {
  try {
    const deviceId = req.query.deviceId || "sensor-1";
    const n = Number(req.query.n || 5);
    if (!contract) throw new Error("Contract not configured");
    const [binding, r] = await Promise.all([
      contract.getDeviceBinding(deviceId),
      contract.lastNReadings(deviceId, n)
    ]);
  const out = [];
    for (let i = 0; i < r[0].length; i++) {
      const sender = r[2][i];
      const account = binding[2];
      const verifiedByTBA = account && account !== '0x0000000000000000000000000000000000000000' && sender.toLowerCase() === account.toLowerCase();
      out.push({ ts: Number(r[0][i]), reading: r[1][i], sender, verifiedByTBA });
    }
    // Compute summary stats (temp & humidity) when reading is JSON
    let temps = [], hums = [];
    for (const row of out) {
      try {
        const obj = JSON.parse(row.reading);
        if (typeof obj?.temp === 'number') temps.push(obj.temp);
        if (typeof obj?.humidity === 'number') hums.push(obj.humidity);
      } catch (_) { /* ignore non-JSON */ }
    }
    const sum = arr => arr.reduce((a,b)=>a+b,0);
    const mm = arr => arr.length ? { min: Math.min(...arr), max: Math.max(...arr), avg: sum(arr)/arr.length } : null;
    const summary = { temp: mm(temps), humidity: mm(hums) };
  const bind = { nft: binding[0], tokenId: Number(binding[1]), account: binding[2] };
  res.json({ deviceId, n, count: out.length, readings: out, summary, binding: bind });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`IoT API listening on :${port}`));
