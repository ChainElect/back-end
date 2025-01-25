require("dotenv").config();
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);

// Make sure that process.env.WALLET_PRIVATE_KEY is not undefined or empty
if (!process.env.WALLET_PRIVATE_KEY) {
  throw new Error("Private key is missing in .env file");
}

const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

module.exports = { provider, wallet };
