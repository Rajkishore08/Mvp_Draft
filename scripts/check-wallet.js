require("dotenv").config();
const { ethers } = require("ethers");

async function main() {
  const rpc = process.env.IOTEX_RPC || "http://127.0.0.1:8545";
  const pk = process.env.IOTEX_PRIVATE_KEY;
  if (!pk) throw new Error("Set IOTEX_PRIVATE_KEY in .env");
  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);
  const [net, bal] = await Promise.all([provider.getNetwork(), provider.getBalance(wallet.address)]);
  console.log("RPC:", rpc);
  console.log("Chain:", net.chainId.toString());
  console.log("Address:", wallet.address);
  console.log("Balance:", ethers.formatEther(bal), "IOTX");
}

main().catch((e) => { console.error(e); process.exit(1); });
