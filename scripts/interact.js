// scripts/interact.js
const { ethers } = require("hardhat");

async function main() {
  // Replace with deployed contract addresses after running deploy.js
  // Use the latest deployed addresses
  const myNFTAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  const simpleStorageAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  const [deployer] = await ethers.getSigners();
  const MyNFT = await ethers.getContractFactory("MyNFT");
  const myNFT = MyNFT.attach(myNFTAddress);
  const SimpleStorage = await ethers.getContractFactory("SimpleStorage");
  const simpleStorage = SimpleStorage.attach(simpleStorageAddress);

  // Mint an NFT (deployer is owner)

  const mintTx = await myNFT.mint(deployer.address);
  const mintReceipt = await mintTx.wait();
  console.log("Mint transaction receipt:", mintReceipt);
  // Print all logs for debugging
  console.log("All logs from mintReceipt:", mintReceipt.logs);
  // Parse NFTMinted event from logs (Ethers v6)
  let tokenId, account;
  for (const log of mintReceipt.logs) {
    if (log.fragment && log.fragment.name === "NFTMinted") {
      tokenId = log.args.tokenId;
      account = log.args.account;
      break;
    }
  }
  if (tokenId !== undefined && account !== undefined) {
    console.log(`Minted NFT #${tokenId} with token-bound account: ${account}`);
  } else {
    console.log("NFTMinted event not found in logs.");
  }

  // Interact with SimpleStorage using the token-bound account
  try {
    const setValueTx = await simpleStorage.setValue(42);
    const setValueReceipt = await setValueTx.wait();
    console.log("setValue transaction receipt:", setValueReceipt);
    if (setValueReceipt.status === 1) {
      try {
        const value = await simpleStorage.value();
        console.log("SimpleStorage value:", value.toString());
      } catch (err) {
        console.error("Error reading SimpleStorage value:", err);
      }
    } else {
      console.log("setValue transaction failed.");
    }
  } catch (err) {
    console.error("Error interacting with SimpleStorage:", err);
  }
  // Interact with SimpleStorage using the token-bound account
  // For demo: send a transaction from deployer (in real use, use the account as a smart wallet)
  const setValueTx = await simpleStorage.setValue(42);
  await setValueTx.wait();
  const value = await simpleStorage.value();
  console.log("SimpleStorage value:", value.toString());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
