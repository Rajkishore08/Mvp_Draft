require("dotenv").config();
const express = require("express");
const cors = require("cors");
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

const app = express();
app.use(cors());

const rpc = process.env.IOTEX_RPC || "https://babel-api.testnet.iotex.io";
const addr = process.env.IOTEX_IOTDATA_ADDRESS;
if (!addr) {
  console.error("IOTEX_IOTDATA_ADDRESS not set in .env");
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
    const r = await contract.lastNReadings(deviceId, n);
  const out = [];
    for (let i = 0; i < r[0].length; i++) {
      out.push({ ts: Number(r[0][i]), reading: r[1][i], sender: r[2][i] });
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
    res.json({ deviceId, n, count: out.length, readings: out, summary });
  } catch (e) { res.status(500).json({ error: String(e.message || e) }); }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`IoT API listening on :${port}`));
