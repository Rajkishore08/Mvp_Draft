// Mint a device NFT and print its tokenId + token-bound account address
require("dotenv").config();
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const addrsPath = path.join(__dirname, "..", "artifacts-addresses", `erc6551-${network}.json`);
  const addrs = JSON.parse(fs.readFileSync(addrsPath, "utf8"));

  const myNFT = await hre.ethers.getContractAt("MyNFT", addrs.myNFT, signer);
  const tx = await myNFT.mint(signer.address);
  const rcpt = await tx.wait();
  // Parse event
  const ev = rcpt.logs.map(l => {
    try { return myNFT.interface.parseLog(l); } catch { return null; }
  }).filter(Boolean).find(e => e.name === "NFTMinted");
  if (!ev) throw new Error("NFTMinted event not found");
  const tokenId = ev.args[1].toString();
  const account = ev.args[2];
  console.log("Minted tokenId:", tokenId);
  console.log("Account:", account);
}

main().catch((e) => { console.error(e); process.exit(1); });
