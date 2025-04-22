const { ethers } = require('ethers');
const zkpService = require('./zkpService');
const merkleTreeService = require('./merkleTreeService');
const pool = require('../config/db');
const { ERROR_MESSAGES } = require('../utilities/messages/errorMessages');

// Constants and configuration
const { ERC20_ABI, ERC20_ADDRESS } = require('../utils/wallet/walletConstants');
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);

/**
 * Prepare vote data with ZKP
 * @param {string} electionId - ID of the election
 * @param {string} partyId - ID of the party
 * @param {Object} userData - Object containing user's nullifier and secret (if already saved)
 * @returns {Promise<Object>} - Returns ZKP data and vote parameters
 */
async function prepareVote(electionId, partyId, userData = null) {
  try {
    // Generate commitment if not provided
    let commitment;
    if (userData && userData.nullifier && userData.secret) {
      // Use existing commitment data
      commitment = await zkpService.recreateCommitment(userData.nullifier, userData.secret);
    } else {
      // Generate new commitment
      commitment = await zkpService.generateCommitment();
    }

    // Add commitment to Merkle tree
    await merkleTreeService.addCommitment(commitment.commitment);

    // Generate ZK proof
    const zkProof = await zkpService.generateVotingProof(
      commitment.nullifier,
      commitment.secret,
      commitment.commitment
    );

    return {
      electionId,
      partyId,
      nullifierHash: zkProof.nullifierHash,
      root: zkProof.root,
      proof_a: zkProof.proof_a,
      proof_b: zkProof.proof_b,
      proof_c: zkProof.proof_c,
      // Include commitment data for the UI to save
      commitmentData: {
        nullifier: commitment.nullifier,
        secret: commitment.secret
      }
    };
  } catch (error) {
    console.error("Error preparing vote:", error);
    throw new Error(ERROR_MESSAGES.VOTE_PREPARATION_FAILED);
  }
}

/**
 * Cast vote directly using blockchain transaction
 * @param {Object} voteData - Vote data including ZKP
 * @returns {Promise<Object>} - Transaction receipt
 */
async function castVote(voteData) {
  try {
    // Get user's private key (should be securely obtained)
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, wallet);

    // Submit vote transaction
    const tx = await contract.vote(
      voteData.electionId,
      voteData.partyId,
      voteData.nullifierHash,
      voteData.root,
      voteData.proof_a,
      voteData.proof_b,
      voteData.proof_c
    );

    // Wait for confirmation
    const receipt = await tx.wait();

    // Store vote data in database (only nullifier hash, not the actual vote!)
    await pool.query(
      "INSERT INTO votes (election_id, nullifier_hash, tx_hash) VALUES ($1, $2, $3)",
      [voteData.electionId, voteData.nullifierHash, receipt.transactionHash]
    );

    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("Error casting vote:", error);
    throw new Error(ERROR_MESSAGES.VOTE_SUBMISSION_FAILED);
  }
}

/**
 * Cast vote via backend API (alternative method)
 * @param {Object} voteData - Vote data including ZKP
 * @returns {Promise<Object>} - Response data
 */
async function castVoteViaAPI(voteData) {
  try {
    // This is a simplified version - in a real implementation, you would:
    // 1. Validate the vote data and ZKP
    // 2. Ensure user hasn't voted before
    // 3. Submit the transaction to the blockchain
    // 4. Record the vote in the database

    // For simplicity, we'll call the same function but with the server's wallet
    return await castVote(voteData);
  } catch (error) {
    console.error("Error casting vote via API:", error);
    throw new Error(ERROR_MESSAGES.VOTE_SUBMISSION_FAILED);
  }
}

/**
 * Check if a user has already voted
 * @param {string} nullifierHash - Hash of the nullifier
 * @returns {Promise<boolean>} - True if user has voted
 */
async function hasVoted(nullifierHash) {
  try {
    const result = await pool.query(
      "SELECT id FROM votes WHERE nullifier_hash = $1",
      [nullifierHash]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking vote status:", error);
    throw new Error(ERROR_MESSAGES.VOTE_STATUS_CHECK_FAILED);
  }
}

module.exports = {
  prepareVote,
  castVote,
  castVoteViaAPI,
  hasVoted
};