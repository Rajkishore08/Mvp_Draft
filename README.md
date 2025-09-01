
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
	- To send more sensors/readings locally:
	  - PowerShell example:
	    - `$env:SENSORS='sensor-1,sensor-2,sensor-3,sensor-4,sensor-5'; $env:ITERATIONS=8; $env:INTERVAL_MS=800; npm run simulate:iotex`
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

## ERC‑6551 device NFTs (optional extension)
Add device ownership with token-bound accounts, then route writes via the account:

1) Deploy ERC‑6551 + MyNFT (localhost)
	- `npm run deploy:6551`
2) Mint a device NFT (records its token-bound account)
	- `npm run mint:device`
3) Send readings through the token-bound account
	- `npm run simulate:6551`
	- For more devices/readings in the plain IoTData path, use the SENSORS/ITERATIONS/INTERVAL_MS envs with simulate:iotex as above.
4) Read as usual via API or `read-device`
	- `node scripts/read-device.js device-0 5`
	- The IoTData contract stores the same payloads; the difference is provenance via the TBA.

## QuickSilver testing (with presets)
1) Start the IoT API (automatic localhost fallback if .env missing)
	- `npm run api:iotex`
2) Start the QuickSilver web server
	- `npm run qs:web` → Open http://localhost:8799
3) Use the “Try a preset” dropdown
	- Latest from device-0
	- Last 5 from device-0
	- Latest from sensor-1
	- Last 3 from sensor-1
4) Or type your own prompt
	- Examples:
		- latest from device device-0
		- last 5 readings from device device-0
		- latest from device sensor-1

## Pushing this MVP to a new GitHub repo
1) Commit the draft (already handled in this branch)
2) Create an empty GitHub repo (no README/license)
3) Point the remote and push:
	- `git remote remove origin` (optional if you want to replace the old one)
	- `git remote add origin <your-new-repo-url.git>`
	- `git push -u origin main`

## Runbook (Windows PowerShell)

Prereqs
- Node.js 18+ and npm
- Git (optional)

1) Install and compile
```
npm install
npx hardhat compile
```

2) Start a local blockchain (new terminal)
```
npx hardhat node
```

3) Deploy IoTData (plain sensor flow)
```
npm run deploy:iot
```

4) Stream mock sensor readings (sensor-1..N)
- Default (sensor-1..5; 5 iterations):
```
npm run simulate:iotex
```
- More sensors/readings (example):
```
$env:SENSORS='sensor-1,sensor-2,sensor-3,sensor-4,sensor-5'
$env:ITERATIONS=8
$env:INTERVAL_MS=800
npm run simulate:iotex
```

5) Start the IoT API (auto-falls back to localhost)
```
npm run api:iotex
```
- API: http://localhost:8787
- Examples:
	- http://localhost:8787/latest?deviceId=sensor-1
	- http://localhost:8787/last?deviceId=sensor-1&n=5

6) Start QuickSilver web (with preset prompts)
```
npm run qs:web
```
Open http://localhost:8799
- Use the “Try a preset” dropdown or type your own prompt
- Examples:
	- latest from device device-0
	- last 3 readings from device sensor-1

7) 6551 device NFT flow (optional, for TBA provenance)
- Deploy 6551 stack (Registry, Account impl, MyNFT):
```
npm run deploy:6551
```
- Mint a device NFT (creates TBA):
```
npm run mint:device
```
- Register device binding in IoTData:
```
npm run register:device
```
- Send readings via TBA (auto-impersonates owner on localhost):
```
npm run simulate:6551
```
- Verify via CLI (shows binding, readings, TBA logs):
```
node scripts/read-device.js device-0 5
```
- In the web UI, TBA-written entries show “Verified by TBA”.

8) Extra reads (plain sensors)
```
node scripts/read-iot.js
```

Troubleshooting
- If QuickSilver shows “0 readings” for sensor-1, run simulate:iotex with SENSORS including sensor-1 (see step 4).
- For simulate:6551 on localhost, owner is auto-impersonated. On testnets, set IOTEX_PRIVATE_KEY to the NFT owner’s key.
- Ports: API 8787, QuickSilver 8799. Ensure they’re free.
