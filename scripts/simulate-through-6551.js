// Send readings by having the token-bound account (ERC-6551) execute IoTData.storeReading
require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const IOT_ABI = [
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

const ACCOUNT_ABI = [
  {
    inputs: [
      { name: "target", type: "address" },
      { name: "value", type: "uint256" },
      { name: "data", type: "bytes" }
    ],
    name: "execute",
    outputs: [{ name: "result", type: "bytes" }],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [
      { name: "action", type: "string" },
      { name: "to", type: "address" },
      { name: "details", type: "string" }
    ],
    name: "logTransaction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  }
];

async function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

async function main(){
  const rpc = process.env.IOTEX_RPC || "http://127.0.0.1:8545";
  const pk = process.env.IOTEX_PRIVATE_KEY; // not required on localhost if using Hardhat task runner
  const network = process.env.NETWORK || "localhost";

  const iotAddrPath = path.join(__dirname, "..", "artifacts-addresses", `iotdata-${network}.json`);
  const tbaPath = path.join(__dirname, "..", "artifacts-addresses", `erc6551-${network}.json`);
  if (!fs.existsSync(iotAddrPath)) throw new Error(`Missing ${iotAddrPath}. Deploy IoTData first.`);
  if (!fs.existsSync(tbaPath)) throw new Error(`Missing ${tbaPath}. Deploy ERC-6551 + MyNFT first.`);
  const iotAddr = JSON.parse(fs.readFileSync(iotAddrPath, "utf8")).address || JSON.parse(fs.readFileSync(iotAddrPath, "utf8")).iotData || JSON.parse(fs.readFileSync(iotAddrPath, "utf8")).IoTData || JSON.parse(fs.readFileSync(iotAddrPath, "utf8")).contract;
  const { myNFT } = JSON.parse(fs.readFileSync(tbaPath, "utf8"));

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = pk ? new ethers.Wallet(pk, provider) : (await provider.getSigner?.(0)) || null;
  const signer = wallet; // ethers v6 in Node: provider.getSigner not available; use wallet when pk provided
  if (!signer) throw new Error("No signer. Set IOTEX_PRIVATE_KEY or run via Hardhat with accounts.");

  // Find latest minted token’s account
  const MyNFT = new ethers.Contract(myNFT, [
    "event NFTMinted(address indexed to, uint256 indexed tokenId, address account)",
    "function getAccount(uint256) view returns (address)",
    "function nextTokenId() view returns (uint256)"
  ], signer);
  const nextId = await MyNFT.nextTokenId();
  if (nextId === 0n) throw new Error("No devices minted yet. Run mint-device first.");
  const tokenId = (nextId - 1n);
  const accountAddr = await MyNFT.getAccount(tokenId);
  if (!accountAddr || accountAddr === ethers.ZeroAddress) throw new Error("No token-bound account found.");

  const account = new ethers.Contract(accountAddr, ACCOUNT_ABI, signer);
  const iotIface = new ethers.Interface(IOT_ABI);

  const deviceId = `device-${tokenId}`;
  for (let i=0;i<3;i++){
    const reading = JSON.stringify({ temp: 22 + Math.random()*5, humidity: 45 + Math.random()*10 });
    const ts = Math.floor(Date.now()/1000);
    const data = iotIface.encodeFunctionData("storeReading", [deviceId, reading, ts]);
    const tx = await account.execute(iotAddr, 0, data, { gasLimit: 300000 });
    const rcpt = await tx.wait();
    console.log(`TBA sent reading for ${deviceId}, tx: ${rcpt.hash}`);
    await account.logTransaction("iot:store", iotAddr, `index=${i}; ts=${ts}`);
    await sleep(1500);
  }

  console.log("Done sending via token-bound account.");
}

main().catch((e)=>{ console.error(e); process.exit(1); });
