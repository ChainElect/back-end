/**
 * @module blockchainProvider
 * @description Sets up the blockchain provider and wallet using ethers.js.
 * The provider is configured via the API_URL environment variable, and the wallet is created using
 * the WALLET_PRIVATE_KEY from the environment. Ensure these variables are properly defined in your .env file.
 */

require("dotenv").config();
const { ethers } = require("ethers");

// Validate that the API_URL is provided
if (!process.env.API_URL) {
  throw new Error("API_URL environment variable is not defined.");
}

const provider = new ethers.providers.Web3Provider(process.env.API_URL);

// Validate that the wallet private key is provided
if (!process.env.WALLET_PRIVATE_KEY) {
  throw new Error("Private key is missing in .env file");
}

const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

module.exports = { provider, wallet };
