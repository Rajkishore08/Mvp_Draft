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
  const ERC6551Account = await ethers.getContractFactory("ERC6551Account");

  console.log("=== ERC-6551 Token-Bound Account Demo: Tomato Batch Tracking ===\n");

  // Mint an NFT representing a batch of tomatoes
  console.log("1. Minting NFT for Tomato Batch...");
  const mintTx = await myNFT.mint(deployer.address);
  const mintReceipt = await mintTx.wait();
  
  // Parse NFTMinted event from logs
  let tokenId, account;
  for (const log of mintReceipt.logs) {
    if (log.fragment && log.fragment.name === "NFTMinted") {
      tokenId = log.args.tokenId;
      account = log.args.account;
      break;
    }
  }
  
  if (tokenId !== undefined && account !== undefined) {
    console.log(`✓ Minted NFT #${tokenId} (Tomato Batch) with token-bound account: ${account}\n`);
  } else {
    console.log("❌ NFTMinted event not found in logs.");
    return;
  }

  // Interact with SimpleStorage using standard contract call
  console.log("2. Testing SimpleStorage interaction...");
  try {
    const setValueTx = await simpleStorage.setValue(42);
    await setValueTx.wait();
    const value = await simpleStorage.value();
    console.log(`✓ SimpleStorage value set to: ${value.toString()}\n`);
  } catch (err) {
    console.error("❌ Error interacting with SimpleStorage:", err.message);
  }

  // Advanced feature: Log custom transactions in the token-bound wallet
  console.log("3. Logging asset transactions in NFT wallet...");
  try {
    const accountContract = ERC6551Account.attach(account);

    // Log an inspection
    console.log("   - Logging inspection...");
    let logTx = await accountContract.logTransaction(
      "Quality Inspection",
      deployer.address,
      "Batch inspected by quality control - Grade A tomatoes, 500kg, Origin: Farm ABC"
    );
    await logTx.wait();
    console.log("   ✓ Inspection logged");

    // Log a payment received
    console.log("   - Logging payment...");
    logTx = await accountContract.logTransaction(
      "Payment Received",
      deployer.address,
      "Payment of 1000 USDC received from buyer XYZ"
    );
    await logTx.wait();
    console.log("   ✓ Payment logged");

    // Log ownership transfer
    console.log("   - Logging transfer...");
    logTx = await accountContract.logTransaction(
      "Ownership Transfer",
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "Ownership transferred to distributor for retail distribution"
    );
    await logTx.wait();
    console.log("   ✓ Transfer logged");

    // Log certification
    console.log("   - Logging certification...");
    logTx = await accountContract.logTransaction(
      "Certification",
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "Organic certification received from authority DEF"
    );
    await logTx.wait();
    console.log("   ✓ Certification logged\n");

    // Fetch and display transaction history
    console.log("4. Retrieving asset transaction history...");
    const history = await accountContract.getTransactionHistory();
    const transactionCount = await accountContract.getTransactionCount();
    
    console.log(`\n=== Transaction History for NFT #${tokenId} (${transactionCount} transactions) ===`);
    history.forEach((tx, idx) => {
      const date = new Date(Number(tx.timestamp) * 1000).toLocaleString();
      console.log(`\n#${idx + 1}: ${tx.action}`);
      console.log(`   Date: ${date}`);
      console.log(`   From: ${tx.from}`);
      console.log(`   To: ${tx.to}`);
      console.log(`   Details: ${tx.details}`);
    });

    console.log(`\n✓ Successfully demonstrated ERC-6551 token-bound account with ${history.length} logged transactions`);
    console.log("✓ Each NFT now has its own programmable wallet that can store transaction history");
    console.log("✓ This enables complete asset tracking and management on-chain");

  } catch (err) {
    console.error("❌ Error with token-bound account operations:", err.message);
  }

  console.log("\n=== Demo Complete ===");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});