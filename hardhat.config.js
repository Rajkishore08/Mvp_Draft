require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.20",
        settings: {
          evmVersion: "cancun",
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.24",
        settings: {
          evmVersion: "cancun",
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  networks: {
    // IoTeX EVM-compatible testnet (chainId 4690)
    iotex_testnet: {
      url: process.env.IOTEX_RPC || "https://babel-api.testnet.iotex.io",
      chainId: 4690,
      accounts: process.env.IOTEX_PRIVATE_KEY ? [process.env.IOTEX_PRIVATE_KEY] : []
    }
  }
// removed extra closing brace
};
