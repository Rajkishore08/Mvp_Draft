
# IoT + QuickSilver MVP (IoTeX / Hardhat)

MVP draft that streams mock IoT sensor data to an on-chain contract and makes it queryable via a tiny REST API and a QuickSilver-like chat interface.

## What’s inside
- `contracts/IoTData.sol` — On-chain store: readings per deviceId with latest/last-N getters
- `scripts/deploy-iot.js` — Deploy IoTData to localhost or IoTeX testnet
- `scripts/simulate-sensors.js` — Push mock JSON readings periodically
- `scripts/read-iot.js` — Read latest and last-N from the contract
- `scripts/iot-api.js` — Express API: `/latest` and `/last` + summary (min/max/avg)
- `quicksilver/` — Intents JSON used by:
  - `scripts/quicksilver-bot.js` (CLI)
  - `scripts/quicksilver-server.js` (web chat UI)
- Extras: `scripts/check-wallet.js`, `scripts/push-local.js`, `contracts/MessageBoard.sol` tutorial

## Quick start (local Hardhat)
1) Install deps
	- `npm install`
2) Compile
	- `npx hardhat compile`
3) Start node (terminal A)
	- `npx hardhat node`
4) Deploy IoTData (terminal B)
	- `npm run deploy:iot`
	- Copy the printed IoTData address into `.env` as `IOTEX_IOTDATA_ADDRESS` (for scripts that rely on it)
5) Push one reading
	- `npm run push:local`
6) Stream mock readings
	- `npm run simulate:iotex`
7) Read back
	- `npm run read:iotex -- sensor-1 5`
8) API
	- `npm run api:iotex` → http://localhost:8787
9) QuickSilver web
	- `npm run qs:web` → http://localhost:8799

Note: `.env` is ignored by git. For localhost, you typically don’t need a private key; Hardhat injects accounts. Some scripts (simulate) also work against localhost without `.env` if you set RPC explicitly inside the script; otherwise, define:
- `IOTEX_RPC=http://127.0.0.1:8545`
- `IOTEX_PRIVATE_KEY=<one of Hardhat/Anvil keys if needed>`

## IoTeX testnet
1) Set `.env`:
	- `IOTEX_RPC=https://babel-api.testnet.iotex.io`
	- `IOTEX_PRIVATE_KEY=<funded testnet key>`
2) Deploy
	- `npm run deploy:iotex`
	- Put the deployed address into `IOTEX_IOTDATA_ADDRESS`
3) Stream + API
	- `npm run simulate:iotex`
	- `npm run api:iotex`

## Notes
- ERC‑6551 demo artifacts from early drafts were removed from scripts; focus here is the IoT + QuickSilver MVP. An ERC‑6551 device-ownership layer can be added later.
- If `npm run api:iotex` or `npm run qs:web` fail, validate `package.json` and `.env`, and ensure the IoTData address is set when required.

## Pushing this MVP to a new GitHub repo
1) Commit the draft (already handled in this branch)
2) Create an empty GitHub repo (no README/license)
3) Point the remote and push:
	- `git remote remove origin` (optional if you want to replace the old one)
	- `git remote add origin <your-new-repo-url.git>`
	- `git push -u origin main`
