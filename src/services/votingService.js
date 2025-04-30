const { ethers } = require('ethers');
const zkpService = require('./zkpService');
const merkleTreeModel = require('../models/merkleTreeModel');
const { ERROR_MESSAGES } = require('../utilities/messages/errorMessages');

// Load contract ABI and address from constants
const { ERC20_ABI, ERC20_ADDRESS } = require('../utils/wallet/walletConstants');

// Initialize provider
let provider;
let votingContract;

/**
 * Initialize the voting service
 */
async function initialize() {
  if (!provider) {
    // Use the RPC URL from environment variables
    provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    
    // Create a wallet instance with the private key
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Create a contract instance
    votingContract = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, wallet);
    
    console.log("Voting service initialized with contract at:", ERC20_ADDRESS);
  }
}

/**
 * Prepare vote data with ZKP
 * @param {string} electionId - ID of the election
 * @param {string} partyId - ID of the party
 * @param {Object} userData - Object containing user's nullifier and secret
 * @returns {Promise<Object>} - Returns ZKP data and vote parameters
 */
async function prepareVote(electionId, partyId, userData) {
  await initialize();
  
  try {
    if (!userData || !userData.nullifier || !userData.secret) {
      throw new Error("Missing voter credentials (nullifier and secret)");
    }
    
    // Recreate commitment from nullifier and secret
    const commitmentData = await zkpService.recreateCommitment(
      userData.nullifier,
      userData.secret
    );
    
    // Verify the commitment is in the Merkle tree
    const isInTree = await zkpService.isCommitmentInTree(commitmentData.commitment);
    if (!isInTree) {
      throw new Error("Voter not registered. Commitment not found in Merkle tree.");
    }
    
    // Generate ZK proof
    const zkProof = await zkpService.generateVotingProof(
      userData.nullifier,
      userData.secret,
      commitmentData.commitment
    );
    
    return {
      electionId,
      partyId,
      nullifierHash: zkProof.nullifierHash,
      root: zkProof.root,
      proof_a: zkProof.proof_a,
      proof_b: zkProof.proof_b,
      proof_c: zkProof.proof_c
    };
  } catch (error) {
    console.error("Error preparing vote:", error);
    throw new Error(error.message || "Vote preparation failed");
  }
}

/**
 * Cast vote using blockchain transaction
 * @param {Object} voteData - Vote data including ZKP
 * @returns {Promise<Object>} - Transaction receipt
 */
async function castVote(voteData) {
  await initialize();
  
  try {
    // Validate required parameters
    if (!voteData.electionId || !voteData.partyId || 
        !voteData.nullifierHash || !voteData.root || 
        !voteData.proof_a || !voteData.proof_b || !voteData.proof_c) {
      throw new Error("Missing required voting parameters");
    }
    
    // Check if nullifier has already been used
    const nullifierUsed = await merkleTreeModel.nullifierExists(voteData.nullifierHash);
    if (nullifierUsed) {
      throw new Error("This vote has already been cast");
    }
    
    // Format parameters for the contract call
    const params = [
      voteData.electionId,
      voteData.partyId,
      voteData.nullifierHash,
      voteData.root,
      voteData.proof_a,
      voteData.proof_b,
      voteData.proof_c
    ];
    
    // Estimate gas for the transaction (optional but recommended)
    const gasEstimate = await votingContract.estimateGas.vote(...params);
    
    // Submit vote transaction with slightly higher gas limit
    const gasLimit = gasEstimate.mul(120).div(100); // Add 20% buffer
    
    const tx = await votingContract.vote(...params, {
      gasLimit
    });
    
    console.log("Vote transaction submitted:", tx.hash);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    
    console.log("Vote confirmed in block:", receipt.blockNumber);
    
    // Mark nullifier as used
    await merkleTreeModel.markNullifierUsed(voteData.nullifierHash);
    
    return {
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    console.error("Error casting vote:", error);
    
    // Handle specific error cases
    if (error.message.includes("already voted")) {
      throw new Error("You have already voted in this election");
    }
    
    throw new Error(error.message || "Vote submission failed");
  }
}

/**
 * Check if a user has already voted
 * @param {string} nullifierHash - Hash of the nullifier
 * @returns {Promise<boolean>} - True if user has voted
 */
async function hasVoted(nullifierHash) {
  return await merkleTreeModel.nullifierExists(nullifierHash);
}

/**
 * Get election details from the blockchain
 * @param {string} electionId - ID of the election
 * @returns {Promise<Object>} - Election details
 */
async function getElectionDetails(electionId) {
  await initialize();
  
  try {
    const details = await votingContract.getElectionDetails(electionId);
    return {
      id: details.id.toString(),
      name: details.name,
      startTime: new Date(details.startTime.toNumber() * 1000),
      endTime: new Date(details.endTime.toNumber() * 1000),
      parties: details.parties.map(party => ({
        id: party.id.toString(),
        name: party.name,
        voteCount: party.voteCount.toString(),
        description: party.description
      }))
    };
  } catch (error) {
    console.error("Error getting election details:", error);
    throw new Error("Failed to retrieve election details");
  }
}

/**
 * Get all ongoing elections
 * @returns {Promise<Array>} - List of ongoing elections
 */
async function getOngoingElections() {
  await initialize();
  
  try {
    const elections = await votingContract.getAllOngoingElections();
    return elections.map(election => ({
      id: election.id.toString(),
      name: election.name,
      startTime: new Date(election.startTime.toNumber() * 1000),
      endTime: new Date(election.endTime.toNumber() * 1000),
      partyCount: election.partyCount.toString()
    }));
  } catch (error) {
    console.error("Error getting ongoing elections:", error);
    throw new Error("Failed to retrieve ongoing elections");
  }
}

/**
 * Get election results
 * @param {string} electionId - ID of the election
 * @returns {Promise<Array>} - Election results (parties with vote counts)
 */
async function getElectionResults(electionId) {
  await initialize();
  
  try {
    const results = await votingContract.getResults(electionId);
    return results.map(party => ({
      id: party.id.toString(),
      name: party.name,
      voteCount: party.voteCount.toString(),
      description: party.description
    }));
  } catch (error) {
    console.error("Error getting election results:", error);
    throw new Error("Failed to retrieve election results");
  }
}

module.exports = {
  initialize,
  prepareVote,
  castVote,
  hasVoted,
  getElectionDetails,
  getOngoingElections,
  getElectionResults
};