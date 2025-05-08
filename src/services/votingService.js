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
 * Initialize the voting service with proper handling of ethers.js v6
 * @returns {Promise<boolean>}
 */
async function initialize() {
  if (!provider || !votingContract) {
    try {
      console.log("Initializing voting service...");
      console.log("Ethers version available:", ethers.version || "unknown");
      
      // Check environment variables
      if (!process.env.SEPOLIA_RPC_URL) {
        throw new Error("Missing SEPOLIA_RPC_URL environment variable");
      }
      
      if (!process.env.PRIVATE_KEY) {
        throw new Error("Missing PRIVATE_KEY environment variable");
      }
      
      // Create provider - handle ethers v6
      try {
        provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        console.log("Created provider with ethers v6 API");
      } catch (e) {
        console.error("Error creating provider:", e);
        throw new Error("Failed to initialize provider: " + e.message);
      }
      
      // Create wallet
      try {
        const privateKey = process.env.PRIVATE_KEY.startsWith('0x') ? 
                          process.env.PRIVATE_KEY : 
                          '0x' + process.env.PRIVATE_KEY;
        
        wallet = new ethers.Wallet(privateKey, provider);
        console.log("Wallet created successfully with address:", wallet.address);
      } catch (e) {
        console.error("Error creating wallet:", e);
        throw new Error("Failed to initialize wallet: " + e.message);
      }
      
      // Create contract with simplified approach for ethers v6
      try {
        // Create a simple contract instance with limited functionality
        // This is a manual approach that avoids ABI parsing issues
        votingContract = {
          address: ERC20_ADDRESS,
          wallet: wallet,
          provider: provider,
          
          // Manually define the vote function
          vote: async function(electionId, partyId, _nullifier, _root, proofA, proofB, proofC, options = {}) {
            console.log("Calling vote with manual implementation");
            
            try {
              // Create interface for encoding function data
              const iface = new ethers.Interface([
                "function vote(uint256 electionId, uint256 partyId, uint256 _nullifier, uint256 _root, uint256[2] proofA, uint256[2][2] proofB, uint256[2] proofC)"
              ]);
              
              // Encode function data
              const data = iface.encodeFunctionData("vote", [
                electionId, 
                partyId, 
                _nullifier, 
                _root, 
                proofA, 
                proofB, 
                proofC
              ]);
              
              // Create transaction
              const tx = {
                to: ERC20_ADDRESS,
                data: data,
                ...options
              };
              
              // Send transaction
              const response = await wallet.sendTransaction(tx);
              return response;
            } catch (error) {
              console.error("Error in vote function:", error);
              throw error;
            }
          },
          
          // Manually define getElectionDetails
          getElectionDetails: async function(electionId) {
            console.log("Calling getElectionDetails with manual implementation");
            
            try {
              // Create interface for encoding function data
              const iface = new ethers.Interface([
                "function getElectionDetails(uint256 electionId) view returns (uint256 id, string name, uint256 startTime, uint256 endTime, tuple(uint256 id, string name, uint256 voteCount, string description)[] parties)"
              ]);
              
              // Encode function data
              const data = iface.encodeFunctionData("getElectionDetails", [electionId]);
              
              // Call contract
              const result = await provider.call({
                to: ERC20_ADDRESS,
                data: data
              });
              
              // Decode result
              const decoded = iface.decodeFunctionResult("getElectionDetails", result);
              
              // Format returned data
              return {
                id: decoded[0],
                name: decoded[1],
                startTime: decoded[2],
                endTime: decoded[3],
                parties: decoded[4]
              };
            } catch (error) {
              console.error("Error in getElectionDetails function:", error);
              throw error;
            }
          }
        };
        
        console.log("Created manual contract wrapper with vote and getElectionDetails functions");
      } catch (e) {
        console.error("Error creating contract instance:", e);
        throw new Error("Failed to initialize contract: " + e.message);
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
 * Prepare vote data with ZKP, ensuring the root is up-to-date
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
    
    // First, ensure the root is up-to-date on the blockchain
    console.log("Checking if Merkle root needs updating...");
    const rootStatus = await checkAndUpdateRoot();
    
    if (rootStatus.updated) {
      console.log("Merkle root was updated on-chain. New root:", rootStatus.updatedRoot);
    } else {
      console.log("Merkle root is already up-to-date:", rootStatus.currentRoot);
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
    
    // Generate ZK proof using the updated root
    console.log("Generating ZK proof with up-to-date root");
    
    // First, get the Merkle path for this commitment
    const merklePath = await zkpService.getMerklePath(commitmentData.commitment);
    
    // Ensure we're using the current on-chain root
    const validRoot = rootStatus.updated ? rootStatus.updatedRoot : rootStatus.currentRoot;
    
    // Generate the ZK proof
    const zkProof = await zkpService.generateVotingProof(
      userData.nullifier,
      userData.secret,
      commitmentData.commitment,
      validRoot // Pass the valid root to ensure it matches what's on chain
    );
    
    // Double-check that the root in the proof is known to the contract
    const isRootKnown = await isRootKnownOnChain(zkProof.root);
    console.log("Is proof root known to contract:", isRootKnown);
    
    if (!isRootKnown) {
      console.warn("Warning: The root used in the proof is not recognized by the contract!");
    }
    
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
 * Check if a root is known to the contract
 * @param {string} root - Root to check
 * @returns {Promise<boolean>} - True if root is known
 */
async function isRootKnownOnChain(root) {
  try {
    // Create interface for function call
    const iface = new ethers.Interface([
      "function isKnownRoot(bytes32 root) view returns (bool)"
    ]);
    
    // Convert root to bytes32 format
    let rootBytes;
    
    // Handle different input formats
    if (typeof root === 'bigint' || !isNaN(root)) {
      rootBytes = ethers.hexlify(
        ethers.zeroPadValue(
          ethers.toBeHex(BigInt(root)),
          32
        )
      );
    } else if (typeof root === 'string' && root.startsWith('0x')) {
      rootBytes = ethers.hexlify(
        ethers.zeroPadValue(
          root,
          32
        )
      );
    } else {
      const encoder = new TextEncoder();
      const data = encoder.encode(root.toString());
      rootBytes = ethers.keccak256(data);
    }
    
    // Encode function data
    const data = iface.encodeFunctionData("isKnownRoot", [rootBytes]);
    
    // Call contract
    const result = await provider.call({
      to: ERC20_ADDRESS,
      data: data
    });
    
    // Decode result
    const [isKnown] = iface.decodeFunctionResult("isKnownRoot", result);
    
    return isKnown;
  } catch (error) {
    console.error("Error checking if root is known:", error);
    return false;
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
async function castVote(voteData) {
  try {
    // Make sure to initialize first
    await initialize();
    
    // Validate required parameters for ZK proof
    if (!voteData.electionId || !voteData.partyId || 
        !voteData.nullifierHash || !voteData.root || 
        !voteData.proof_a || !voteData.proof_b || !voteData.proof_c) {
      throw new Error("Missing required voting parameters");
    }
    
    // Log the vote attempt with truncated nullifier for privacy in logs
    console.log(`Vote attempt: Election #${voteData.electionId}, Party #${voteData.partyId}, Nullifier: ${voteData.nullifierHash.substring(0, 10)}...`);
    
    // Check if nullifier has already been used
    const nullifierUsed = await merkleTreeModel.nullifierExists(voteData.nullifierHash);
    if (nullifierUsed) {
      console.error(`Rejected: Nullifier ${voteData.nullifierHash.substring(0, 10)}... has already been used for voting`);
      throw new Error("This vote has already been cast");
    }
    
    console.log(`Preparing to cast vote with contract: ${ERC20_ADDRESS}`);
    console.log(`Vote data: Election #${voteData.electionId}, Party #${voteData.partyId}, Nullifier: ${voteData.nullifierHash.substring(0, 10)}...`);
    
    // Set up the gas options - increased for complex operations
    const gasLimit = 900000; // Increased from 750000 for more complex transactions
    const gasOptions = { gasLimit: ethers.toBigInt(gasLimit) };
    
    console.log("Creating transaction for vote submission...");
    
    try {
      // Create interface for encoding
      const iface = new ethers.Interface([
        "function vote(uint256 electionId, uint256 partyId, uint256 _nullifier, uint256 _root, uint256[2] proofA, uint256[2][2] proofB, uint256[2] proofC)"
      ]);
      
      // Ensure all parameters are correctly formatted as BigInt
      const electionId = BigInt(voteData.electionId);
      const partyId = BigInt(voteData.partyId);
      const nullifier = BigInt(voteData.nullifierHash);
      const root = BigInt(voteData.root);
      
      // Format proof arrays correctly
      const proofA = voteData.proof_a.map(p => BigInt(p.toString()));
      const proofB = voteData.proof_b.map(row => row.map(p => BigInt(p.toString())));
      const proofC = voteData.proof_c.map(p => BigInt(p.toString()));
      
      console.log("Encoding vote function with parameters...");
      
      // Encode function call
      const data = iface.encodeFunctionData("vote", [
        electionId,
        partyId,
        nullifier,
        root,
        proofA,
        proofB,
        proofC
      ]);
      
      console.log(`Encoded transaction data (truncated): ${data.substring(0, 50)}...`);
      
      // Create transaction
      const tx = {
        to: ERC20_ADDRESS,
        data: data,
        ...gasOptions
      };
      
      // Check if wallet is initialized
      if (!wallet || !wallet.address) {
        throw new Error("Wallet not properly initialized");
      }
      
      console.log(`Sending transaction from wallet: ${wallet.address.substring(0, 10)}...`);
      const response = await wallet.sendTransaction(tx);
      console.log(`Transaction sent: ${response.hash}`);
      
      // Wait for confirmation with timeout
      console.log("Waiting for transaction confirmation...");
      const receipt = await Promise.race([
        response.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Transaction confirmation timeout")), 120000) // 2 minute timeout
        )
      ]);
      
      // Check transaction status
      if (receipt.status === 0) {
        console.error(`Transaction failed on blockchain: ${receipt.hash}`);
        throw new Error("Transaction failed on blockchain");
      }
      
      console.log(`Vote confirmed in block: ${receipt.blockNumber}`);
      
      // Double-check nullifier hasn't been used in the meantime (race condition check)
      const nullifierStillUnused = !(await merkleTreeModel.nullifierExists(voteData.nullifierHash));
      if (!nullifierStillUnused) {
        console.error(`Nullifier ${voteData.nullifierHash.substring(0, 10)}... was marked as used during transaction confirmation!`);
        throw new Error("Vote was already recorded during transaction processing");
      }
      
      // Mark nullifier as used
      console.log(`Marking nullifier ${voteData.nullifierHash.substring(0, 10)}... as used in database`);
      const marked = await merkleTreeModel.markNullifierUsed(voteData.nullifierHash);
      
      if (!marked) {
        console.warn(`Failed to mark nullifier ${voteData.nullifierHash.substring(0, 10)}... as used in database, but blockchain transaction succeeded`);
      }
      
      // Get updated election results if needed
      let updatedResults = null;
      try {
        updatedResults = await getElectionResults(voteData.electionId);
        console.log(`Updated vote count for party ${voteData.partyId}: ${
          updatedResults.find(p => p.id.toString() === voteData.partyId.toString())?.voteCount || 'unknown'
        }`);
      } catch (resultError) {
        console.warn("Could not fetch updated election results:", resultError.message);
      }
      
      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        updatedResults: updatedResults
      };
    } catch (txError) {
      // Handle specific blockchain errors
      if (txError.message && txError.message.includes("already revealed")) {
        throw new Error("This vote has already been cast");
      } else if (txError.message && txError.message.includes("invalid proof")) {
        throw new Error("Vote rejected: invalid cryptographic proof");
      } else if (txError.message && txError.message.includes("election has ended")) {
        throw new Error("Voting period for this election has ended");
      } else if (txError.message && txError.message.includes("election not started")) {
        throw new Error("Voting period for this election has not started yet");
      }
      
      console.error("Transaction error:", txError);
      throw new Error(`Transaction failed: ${txError.message}`);
    }
  } catch (error) {
    console.error("Error casting vote:", error);
    
    // Handle specific error cases with user-friendly messages
    if (error.message && error.message.includes("already voted") || 
        error.message && error.message.includes("already been cast") ||
        error.message && error.message.includes("already revealed")) {
      throw new Error("You have already voted in this election");
    } else if (error.message && error.message.includes("Wallet not properly initialized")) {
      throw new Error("System error: Voting service not properly initialized");
    } else if (error.message && error.message.includes("Transaction confirmation timeout")) {
      throw new Error("Vote submission is taking longer than expected. Please check the election status in a few minutes to confirm your vote");
    } else if (error.code === "INSUFFICIENT_FUNDS") {
      throw new Error("System error: Insufficient blockchain funds for processing votes");
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

/**
 * Updates the Merkle root in the blockchain contract
 * @param {string} root - The Merkle root to update on-chain
 * @returns {Promise<boolean>} - True if update was successful
 */
async function updateRootOnChain(root) {
  try {
    // Make sure we're initialized
    await initialize();
    
    console.log("Preparing to update Merkle root on chain");
    console.log("Root to update:", root);
    
    // Create interface for the updateRoot function
    const iface = new ethers.Interface([
      "function updateRoot(bytes32 newRoot)"
    ]);
    
    // Convert root to bytes32 format (handling different input formats)
    let rootBytes;
    
    // If root is a BigInt or a numeric string
    if (typeof root === 'bigint' || !isNaN(root)) {
      rootBytes = ethers.hexlify(
        ethers.zeroPadValue(
          ethers.toBeHex(BigInt(root)),
          32
        )
      );
    } 
    // If root is already a hex string
    else if (typeof root === 'string' && root.startsWith('0x')) {
      rootBytes = ethers.hexlify(
        ethers.zeroPadValue(
          root,
          32
        )
      );
    } 
    // Otherwise, treat as a regular string and hash it
    else {
      const encoder = new TextEncoder();
      const data = encoder.encode(root.toString());
      rootBytes = ethers.keccak256(data);
    }
    
    console.log("Encoded root bytes:", rootBytes);
    
    // Encode function data
    const data = iface.encodeFunctionData("updateRoot", [rootBytes]);
    
    // Check if the wallet has permissions to update the root (admin check)
    console.log("Checking if wallet is the owner of the contract...");
    
    try {
      const ownerIface = new ethers.Interface([
        "function owner() view returns (address)"
      ]);
      
      const ownerCall = ownerIface.encodeFunctionData("owner", []);
      const ownerResult = await provider.call({
        to: ERC20_ADDRESS,
        data: ownerCall
      });
      
      const [ownerAddress] = ownerIface.decodeFunctionResult("owner", ownerResult);
      
      console.log("Contract owner:", ownerAddress);
      console.log("Wallet address:", wallet.address);
      
      if (ownerAddress.toLowerCase() !== wallet.address.toLowerCase()) {
        console.log("Warning: Wallet is not the contract owner, transaction might fail");
      }
    } catch (error) {
      console.log("Could not check contract owner:", error.message);
    }
    
    // Create transaction with higher gas limit for complex operations
    const tx = {
      to: ERC20_ADDRESS,
      data: data,
      gasLimit: ethers.toBigInt(500000)
    };
    
    // Send transaction
    console.log("Sending updateRoot transaction...");
    const response = await wallet.sendTransaction(tx);
    console.log("Transaction sent:", response.hash);
    
    // Wait for confirmation
    console.log("Waiting for transaction confirmation...");
    const receipt = await response.wait();
    
    // Check transaction status
    if (receipt.status === 1) {
      console.log("Root updated successfully in block:", receipt.blockNumber);
      return true;
    } else {
      console.log("Root update transaction reverted. Receipt:", JSON.stringify(receipt, null, 2));
      return false;
    }
  } catch (error) {
    console.error("Error updating root:", error);
    throw error;
  }
}

/**
 * Gets the current root status and updates it if needed
 * @returns {Promise<{currentRoot: string, updatedRoot: string, updated: boolean}>}
 */
async function checkAndUpdateRoot() {
  try {
    // Initialize first
    await initialize();
    
    // Step 1: Get the current on-chain root
    console.log("Getting current root from blockchain...");
    let currentOnChainRoot;
    
    try {
      const iface = new ethers.Interface([
        "function getLastRoot() view returns (bytes32)"
      ]);
      
      const data = iface.encodeFunctionData("getLastRoot", []);
      const result = await provider.call({
        to: ERC20_ADDRESS,
        data: data
      });
      
      [currentOnChainRoot] = iface.decodeFunctionResult("getLastRoot", result);
      console.log("Current on-chain root:", currentOnChainRoot);
    } catch (error) {
      console.log("Could not get current root from blockchain:", error.message);
      currentOnChainRoot = null;
    }
    
    // Step 2: Get the latest root from our off-chain database
    console.log("Getting latest root from database...");
    let offChainRoot;
    
    try {
      offChainRoot = await merkleTreeModel.getLatestRoot();
      console.log("Latest off-chain root:", offChainRoot);
    } catch (error) {
      console.log("Could not get latest root from database:", error.message);
      offChainRoot = null;
    }
    
    // Step 3: If roots don't match, update on-chain
    if (offChainRoot && (!currentOnChainRoot || 
        (currentOnChainRoot.toLowerCase() !== offChainRoot.toLowerCase()))) {
      console.log("Roots don't match, updating on-chain...");
      const updated = await updateRootOnChain(offChainRoot);
      
      return {
        currentRoot: currentOnChainRoot,
        updatedRoot: offChainRoot,
        updated: updated
      };
    } else {
      console.log("Roots match, no update needed");
      return {
        currentRoot: currentOnChainRoot,
        updatedRoot: currentOnChainRoot,
        updated: false
      };
    }
  } catch (error) {
    console.error("Error in checkAndUpdateRoot:", error);
    throw error;
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