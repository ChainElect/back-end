const Sentry = require("@sentry/node");
const { ethers } = require("ethers");
const identityZkpBridgeService = require("../services/identityZkpBridgeService");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");
const { SUCCESS_MESSAGES } = require("../utilities/messages/successMessages");
const { ERC20_ABI, ERC20_ADDRESS } = require("../utils/wallet/walletConstants");

// Initialize provider
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

// Initialize wallet and contract
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const votingContract = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, wallet);

// Prepare vote data for ZKP
exports.prepareVote = async (req, res) => {
  const { nullifier, secret, electionId, partyId } = req.body;
  
  if (!nullifier || !secret || !electionId || !partyId) {
    return res.status(400).json({
      success: false,
      message: "Nullifier, secret, election ID, and party ID are required."
    });
  }
  
  try {
    // Prepare vote data with ZKP
    const voteData = await identityZkpBridgeService.prepareVoteData(
      nullifier,
      secret,
      electionId,
      partyId
    );
    
    // Return voting data to frontend
    return res.status(200).json({
      success: true,
      voteData
    });
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.COMMON.SERVER_ERROR,
      error: error.message
    });
  }
};

// Cast a vote with ZKP
exports.castVote = async (req, res) => {
  const { 
    electionId, 
    partyId, 
    nullifierHash, 
    root, 
    proof_a, 
    proof_b, 
    proof_c 
  } = req.body;
  
  if (!electionId || !partyId || !nullifierHash || !root || !proof_a || !proof_b || !proof_c) {
    return res.status(400).json({
      success: false,
      message: "All vote parameters are required."
    });
  }
  
  try {
    // Submit vote transaction
    const tx = await votingContract.vote(
      electionId,
      partyId,
      nullifierHash,
      root,
      proof_a,
      proof_b,
      proof_c
    );
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    // Return transaction receipt
    return res.status(200).json({
      success: true,
      message: "Vote cast successfully",
      txHash: receipt.transactionHash
    });
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json({
      success: false,
      message: "Failed to cast vote",
      error: error.message
    });
  }
};