require("dotenv").config();
const { Web3 } = require('web3');

const RPC = process.env.IOTEX_RPC || 'https://babel-api.testnet.iotex.io';
const CONTRACT = process.env.MESSAGEBOARD_ADDRESS; // set after deploy
const PRIVATE_KEY = process.env.IOTEX_PRIVATE_KEY; // 0x...

const abi = [
  {
    "anonymous": false,
    "inputs": [
      { "indexed": false, "internalType": "address", "name": "sender", "type": "address" },
      { "indexed": false, "internalType": "string", "name": "message", "type": "string" }
    ],
    "name": "MessagePosted",
    "type": "event"
  },
  {
    "inputs": [ { "internalType": "string", "name": "message", "type": "string" } ],
    "name": "postMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function main() {
  if (!CONTRACT) throw new Error('Set MESSAGEBOARD_ADDRESS in .env');
  if (!PRIVATE_KEY) throw new Error('Set IOTEX_PRIVATE_KEY in .env');

  const web3 = new Web3(RPC);
  const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
  web3.eth.accounts.wallet.add(account);
  const contract = new web3.eth.Contract(abi, CONTRACT);

  const text = process.argv[2] || 'Hello from IoTeX!';
  console.log(`Sending message: ${text}`);
  const tx = contract.methods.postMessage(text);
  const gas = await tx.estimateGas({ from: account.address });
  const receipt = await tx.send({ from: account.address, gas });
  console.log('Transaction receipt:', receipt.transactionHash);
}

main().catch((e) => { console.error(e); process.exit(1); });
