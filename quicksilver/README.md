# QuickSilver AI Prototype Integration

This folder contains a minimal intent setup to let QuickSilver query the IoTeX IoT data API.

## Prerequisites
- Run the IoT API locally: `node scripts/iot-api.js`
- Ensure `.env` has `IOTEX_IOTDATA_ADDRESS` (deployed on IoTeX testnet) and `IOTEX_RPC`.

## Intents
- `intents.json` defines two intents:
  - `get_latest_temperature`: GET /latest?deviceId=<id>
  - `get_last_n_readings`: GET /last?deviceId=<id>&n=<n>

Import or map these intents into QuickSilver’s intent system. Point the HTTP actions to `http://localhost:8787`.

## Example utterances
- “What’s the latest temperature?”
- “Show last 10 readings from device sensor-1.”

## API endpoints
- GET /latest?deviceId=sensor-1
- GET /last?deviceId=sensor-1&n=10
