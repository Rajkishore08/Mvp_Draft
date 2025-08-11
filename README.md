
# ERC-6551 Token-Bound Account Sample Project

## Objective
Demonstrate a working example where each NFT (ERC-721) has its own programmable wallet account, following the ERC-6551 standard.

## Project Structure
- `contracts/ERC6551.sol`: ERC-6551 Registry and Account implementation
- `contracts/MyNFT.sol`: ERC-721 NFT contract with token-bound account integration
- `contracts/SimpleStorage.sol`: Demo contract for programmable wallet interaction
- `scripts/deploy.js`: Deploys all contracts
- `scripts/interact.js`: Demonstrates minting, wallet creation, and programmable wallet features

## Setup & Usage
1. **Install dependencies:**
	```
	npm install
	```
2. **Compile contracts:**
	```
	npx hardhat compile
	```
3. **Start a local node:**
	```
	npx hardhat node
	```
4. **Deploy contracts:** (in a new terminal)
	```
	npx hardhat run scripts/deploy.js --network localhost
	```
5. **Update `scripts/interact.js` with the deployed addresses.**
6. **Run the interaction script:**
	```
	npx hardhat run scripts/interact.js --network localhost
	```

## Demonstration
- Mint an NFT with `MyNFT.mint()`. This automatically creates a token-bound account (wallet) for the NFT.
- The wallet is linked to the NFT and controlled by the NFT holder.
- The wallet can:
  - Hold tokens
  - Execute transactions on other contracts (demonstrated with `SimpleStorage`)
  - Store and manage custom NFT data

## How ERC-6551 is Used
- `ERC6551.sol` provides the registry and account logic for token-bound accounts.
- `MyNFT.sol` integrates with the registry to create a wallet for each NFT at mint.
- The wallet is programmable and can interact with other contracts.

## Submission Checklist
- [x] All contracts and scripts are present and clean
- [x] README.md is clear and complete
- [x] Project compiles and runs as expected
- [x] Demonstration output is saved (see terminal logs)
- [x] Addresses in scripts are up to date

## Optional Extensions
- Add more wallet features (ERC-20 support, custom data)
- Add automated tests
- Add a frontend or deploy to a public testnet

---
**This project demonstrates ERC-6551 token-bound accounts in action, with full local deployment and interaction.**
