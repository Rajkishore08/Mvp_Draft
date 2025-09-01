// Register a deviceId to its NFT and token-bound account (optional account)
require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main(){
  const [signer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const iotPath = path.join(__dirname, "..", "artifacts-addresses", `iotdata-${network}.json`);
  const tbaPath = path.join(__dirname, "..", "artifacts-addresses", `erc6551-${network}.json`);
  if (!fs.existsSync(iotPath)) throw new Error(`Missing ${iotPath}`);
  if (!fs.existsSync(tbaPath)) throw new Error(`Missing ${tbaPath}`);
  const iotAddrFile = JSON.parse(fs.readFileSync(iotPath, "utf8"));
  const iotAddr = iotAddrFile.address || iotAddrFile.iotData || iotAddrFile.IoTData || iotAddrFile.contract;
  const { myNFT } = JSON.parse(fs.readFileSync(tbaPath, "utf8"));

  // Use last minted tokenId by default
  const myNFTc = await hre.ethers.getContractAt("MyNFT", myNFT, signer);
  const nextId = await myNFTc.nextTokenId();
  if (nextId === 0n) throw new Error("No NFTs minted; run mint-device first.");
  const tokenId = nextId - 1n;
  const account = await myNFTc.getAccount(tokenId);
  const deviceId = `device-${tokenId}`;

  const iot = await hre.ethers.getContractAt("IoTData", iotAddr, signer);
  const tx = await iot.registerDevice(deviceId, myNFT, tokenId, account);
  const rcpt = await tx.wait();
  console.log(`Registered ${deviceId} -> NFT ${myNFT} #${tokenId} account ${account} tx ${rcpt.hash}`);
}

main().catch((e)=>{ console.error(e); process.exit(1); });
