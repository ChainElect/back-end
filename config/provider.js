require('dotenv').config();
const { ethers } = require('ethers');

// Ensure that the environment variables are being read correctly
console.log('Private Key:', process.env.WALLET_PRIVATE_KEY); // Debug log to check if the private key is loaded correctly

const provider = new ethers.JsonRpcProvider(process.env.API_URL);

// Make sure that process.env.WALLET_PRIVATE_KEY is not undefined or empty
if (!process.env.WALLET_PRIVATE_KEY) {
  throw new Error('Private key is missing in .env file');
}

const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

module.exports = { provider, wallet };