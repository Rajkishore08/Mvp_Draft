# ERC-6551 Sample Project - Summary Report

## Project Overview
This project demonstrates the ERC-6551 standard by creating a system where each NFT (ERC-721) minted has its own programmable wallet account (token-bound account). The solution uses Solidity smart contracts and the Hardhat development environment.

## Key Components
- **ERC6551.sol**: Implements the ERC-6551 Registry and Account contracts, enabling token-bound accounts for NFTs.
- **MyNFT.sol**: An ERC-721 contract that mints NFTs and, upon minting, creates a token-bound wallet for each NFT using the registry.
- **SimpleStorage.sol**: A simple contract to demonstrate programmable wallet features (e.g., storing and updating a value).
- **deploy.js**: Script to deploy all contracts to a local Hardhat node.
- **interact.js**: Script to mint an NFT, create a token-bound account, and interact with SimpleStorage.

## Demonstrated Features
- **NFT Minting**: Each NFT minted via `MyNFT.sol` automatically gets a unique wallet account.
- **Token-Bound Wallet**: The wallet is linked to the NFT and controlled by the NFT holder.
- **Programmable Wallet**: The wallet can hold tokens, execute transactions, and interact with other contracts (demonstrated with SimpleStorage).
- **Custom Data**: The wallet can store and manage custom NFT data.

## How It Works
1. **Deploy Contracts**: All contracts are deployed to a local Hardhat node.
2. **Mint NFT**: The interaction script mints an NFT, triggering the creation of a token-bound account.
3. **Wallet Usage**: The script demonstrates the wallet interacting with SimpleStorage, showing programmable wallet capabilities.

## Usage Instructions
- See the README.md for full setup and usage steps.
- All scripts and contracts are ready for local testing and demonstration.

## Submission Checklist
- [x] All contracts and scripts are present and clean
- [x] README.md is clear and complete
- [x] Project compiles and runs as expected
- [x] Demonstration output is saved (see terminal logs)
- [x] Addresses in scripts are up to date

## Notes
- The project is ready for review and further extension if required (e.g., more wallet features, frontend, testnet deployment).

---
**This project provides a complete, working example of ERC-6551 token-bound accounts in Solidity.**
