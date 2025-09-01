// Show device binding, last-N readings, and recent TBA transaction logs
require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const IOT_ABI = [
  "function getDeviceBinding(string deviceId) view returns (address nft, uint256 tokenId, address account)",
  "function lastNReadings(string deviceId, uint256 n) view returns (uint256[] timestamps, string[] readings, address[] senders)"
];

const ACCOUNT_ABI = [
  "function getTransactionCount() view returns (uint256)",
  "function getTransaction(uint256 index) view returns (tuple(uint256 timestamp, string action, address from, address to, string details))"
];

async function main(){
  const deviceId = process.argv[2] || "device-0";
  const n = Number(process.argv[3] || 5);
  const rpc = process.env.IOTEX_RPC || "http://127.0.0.1:8545";
  const network = process.env.NETWORK || "localhost";
  const iotPath = path.join(__dirname, "..", "artifacts-addresses", `iotdata-${network}.json`);
  if (!fs.existsSync(iotPath)) throw new Error(`Missing ${iotPath}`);
  const iotAddrFile = JSON.parse(fs.readFileSync(iotPath, "utf8"));
  const iotAddr = iotAddrFile.address || iotAddrFile.iotData || iotAddrFile.IoTData || iotAddrFile.contract;

  const provider = new ethers.JsonRpcProvider(rpc);
  const iot = new ethers.Contract(iotAddr, IOT_ABI, provider);

  const binding = await iot.getDeviceBinding(deviceId);
  const bindingObj = { nft: binding[0], tokenId: binding[1].toString(), account: binding[2] };
  console.log("Binding:", bindingObj);

  const r = await iot.lastNReadings(deviceId, n);
  const out = [];
  for (let i=0;i<r[0].length;i++){
    out.push({ ts: Number(r[0][i]), reading: r[1][i], sender: r[2][i], verifiedByTBA: bindingObj.account && bindingObj.account.toLowerCase() === r[2][i].toLowerCase() });
  }
  console.log("Last", out.length, "readings:");
  for (const row of out) {
    console.log(`- ${new Date(row.ts*1000).toISOString()} sender=${row.sender}${row.verifiedByTBA?' [Verified by TBA]':''} reading=${row.reading}`);
  }

  if (bindingObj.account && bindingObj.account !== ethers.ZeroAddress) {
    const account = new ethers.Contract(bindingObj.account, ACCOUNT_ABI, provider);
    const count = await account.getTransactionCount();
    const take = Math.min(Number(count), 5);
    console.log(`TBA transactions (last ${take}/${count}):`);
    for (let i = Number(count) - take; i < Number(count); i++){
      if (i < 0) continue;
      const t = await account.getTransaction(i);
      console.log(`#${i} ${new Date(Number(t[0])*1000).toISOString()} action=${t[1]} from=${t[2]} to=${t[3]} details=${t[4]}`);
    }
  } else {
    console.log("No TBA account bound to this device.");
  }
}

main().catch((e)=>{ console.error(e); process.exit(1); });
