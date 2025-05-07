const { ethers } = require('ethers');
const Web3 = require('web3');
const merkleTreeModel = require('../models/merkleTreeModel');
const { ERROR_MESSAGES } = require('../utilities/messages/errorMessages');
const zkpService = require('./zkpService');
const { getDefaultProvider } = require('ethers');
// Load contract ABI and address from constants
const { ERC20_ABI, ERC20_ADDRESS } = require('../utils/wallet/walletConstants.cjs');

// Initialize provider
let provider;
let votingContract;

/**
 * Initialize the voting service
 * @returns {Promise<void>}
 */
async function initialize() {
  if (!provider || !votingContract) {
    try {
      console.log("Initializing voting service...");
      console.log("Ethers version available:", ethers.version || "unknown");
      
      // Fallback to Web3 if ethers doesn't work correctly
      let web3;
      
      // Create provider - handle both ethers v5 and v6 APIs
      if (!process.env.SEPOLIA_RPC_URL) {
        throw new Error("Missing SEPOLIA_RPC_URL environment variable");
      }
      
      try {
        if (ethers.providers && ethers.providers.JsonRpcProvider) {
          // ethers v5
          provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
          console.log("Created provider with ethers v5 API");
        } else if (ethers.JsonRpcProvider) {
          // ethers v6
          provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
          console.log("Created provider with ethers v6 API");
        } else {
          // Try Web3 fallback
          console.log("Falling back to Web3...");
          web3 = new Web3(process.env.SEPOLIA_RPC_URL);
          console.log("Created Web3 provider instance");
        }
      } catch (e) {
        console.error("Error creating provider:", e);
        console.log("Falling back to Web3...");
        web3 = new Web3(process.env.SEPOLIA_RPC_URL);
        console.log("Created Web3 provider instance");
      }
      
      // Verify private key is available
      if (!process.env.PRIVATE_KEY) {
        throw new Error("Missing PRIVATE_KEY environment variable");
      }
      
      let wallet;
      if (web3) {
        // Using Web3
        const privateKey = process.env.PRIVATE_KEY.startsWith('0x') ? 
                          process.env.PRIVATE_KEY : 
                          '0x' + process.env.PRIVATE_KEY;
        
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);
        web3.eth.defaultAccount = account.address;
        
        console.log("Web3 wallet created successfully:", account.address);
        
        // Create Web3 contract instance
        const contract = new web3.eth.Contract(ERC20_ABI, ERC20_ADDRESS);
        
        // Create wrapper for compatibility
        votingContract = {
          address: ERC20_ADDRESS,
          vote: async (electionId, partyId, options = {}) => {
            console.log("Calling vote via Web3 with params:", electionId, partyId);
            const tx = await contract.methods.vote(electionId, partyId).send({
              from: account.address,
              gas: options.gasLimit || 500000
            });
            return {
              hash: tx.transactionHash,
              wait: async () => tx
            };
          },
          functions: {}
        };
        
        // Add function names to the wrapper functions property
        ERC20_ABI.forEach(item => {
          if (item.type === 'function') {
            votingContract.functions[item.name] = true;
          }
        });
        
        console.log("Web3 contract wrapper created with methods:", Object.keys(votingContract.functions));
      } else {
        // Using ethers
        try {
          if (ethers.Wallet) {
            // ethers v5
            wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
            console.log("Created wallet with ethers v5 API");
          } else if (ethers.wallet && ethers.wallet.Wallet) {
            // ethers v6
            wallet = new ethers.wallet.Wallet(process.env.PRIVATE_KEY, provider);
            console.log("Created wallet with ethers v6 API");
          } else {
            throw new Error("Could not create wallet instance");
          }
          
          console.log("Ethers wallet created successfully");
          
          // Create contract instance
          votingContract = new ethers.Contract(ERC20_ADDRESS, ERC20_ABI, wallet);
          
          // Check if contract functions exist
          if (!votingContract.functions) {
            throw new Error("Contract instance missing functions property");
          }
          
          console.log("Available contract methods:", Object.keys(votingContract.functions));
        } catch (e) {
          console.error("Error in ethers setup:", e);
          throw e;
        }
      }
      
      console.log("Voting service initialized with contract at:", ERC20_ADDRESS);
      
      return true;
    } catch (error) {
      console.error("Failed to initialize voting service:", error);
      throw error;
    }
  }
  
  return true; // Already initialized
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
      proof_c: zkProof.proof_c,
      // Store commitment data for reference
      commitmentData: {
        nullifier: userData.nullifier,
        secret: userData.secret
      }
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
/**
 * Cast vote using blockchain transaction
 * @param {Object} voteData - Vote data including ZKP
 * @returns {Promise<Object>} - Transaction receipt
 */
/**
 * Cast vote using blockchain transaction
 * @param {Object} voteData - Vote data including ZKP
 * @returns {Promise<Object>} - Transaction receipt
 */
async function castVote(voteData) {
  try {
    // Make sure to initialize first
    await initialize();
    
    // Check if votingContract was successfully initialized
    if (!votingContract) {
      throw new Error("Voting contract not initialized properly. Check your connection settings.");
    }
    
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
    
    console.log("Preparing to cast vote with contract:", ERC20_ADDRESS);
    console.log("Vote data:", {
      electionId: voteData.electionId,
      partyId: voteData.partyId,
      nullifierHash: voteData.nullifierHash.substring(0, 15) + "..." // Truncate for logging
    });
    
    // Check if contract has vote method
    if (typeof votingContract.vote !== 'function') {
      console.error("Contract methods available:", Object.keys(votingContract.functions));
      throw new Error("Contract does not have a vote method. Check your ABI configuration.");
    }
    
    // Convert parameters correctly based on ethers version
    let electionIdParam, partyIdParam;
    
    // Handle different ethers versions
    if (ethers.BigNumber) {
      // Ethers v5
      try {
        electionIdParam = ethers.BigNumber.from(voteData.electionId);
        partyIdParam = ethers.BigNumber.from(voteData.partyId);
      } catch (e) {
        console.log("Error converting to BigNumber, using string values:", e.message);
        electionIdParam = voteData.electionId;
        partyIdParam = voteData.partyId;
      }
    } else {
      // Ethers v6 or other
      try {
        electionIdParam = ethers.toBigInt(voteData.electionId);
        partyIdParam = ethers.toBigInt(voteData.partyId);
      } catch (e) {
        console.log("Error converting to BigInt, using string values:", e.message);
        electionIdParam = voteData.electionId;
        partyIdParam = voteData.partyId;
      }
    }
    
    console.log("Using parameters:", {
      electionId: typeof electionIdParam,
      partyId: typeof partyIdParam
    });
    
    // Create transaction options with gas settings
    const txOptions = {
      gasLimit: 500000 // Set a reasonable gas limit
    };
    
    // Submit vote transaction, handle different contract interfaces
    console.log("Calling contract vote method...");
    let tx;
    try {
      tx = await votingContract.vote(electionIdParam, partyIdParam, txOptions);
    } catch (e) {
      console.error("Error in first vote attempt:", e.message);
      
      // Try alternative parameter format without options
      console.log("Trying alternative vote call format...");
      tx = await votingContract.vote(electionIdParam, partyIdParam);
    }
    
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
    if (error.message && error.message.includes("already voted")) {
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
    
    // Convert BigNumber or similar to regular numbers safely
    const startTimeNum = typeof details.startTime.toNumber === 'function' ? 
      details.startTime.toNumber() : 
      Number(details.startTime);
      
    const endTimeNum = typeof details.endTime.toNumber === 'function' ? 
      details.endTime.toNumber() : 
      Number(details.endTime);
    
    return {
      id: details.id.toString(),
      name: details.name,
      startTime: new Date(startTimeNum * 1000),
      endTime: new Date(endTimeNum * 1000),
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