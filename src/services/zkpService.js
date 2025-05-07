// Fix for src/services/zkpService.js to handle ethers.js v6
const { ethers } = require("ethers");
const { buildMimcSponge } = require("circomlibjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");
const merkleTreeModel = require("../models/merkleTreeModel");

// Constants
const TREE_LEVELS = 20;
const ZKEY_PATH = path.join(__dirname, "../utils/Verifier.zkey");
const WASM_PATH = path.join(__dirname, "../utils/Verifier.wasm"); 

let mimc = null;

// Initialize MiMC hash function 
async function initialize() {
  if (!mimc) {
    mimc = await buildMimcSponge();
    console.log("MiMC initialized for ZKP operations");
  }
}

// Generate a new commitment/nullifier pair
async function generateCommitment() {
  await initialize();
  
  // Generate random nullifier and secret
  const nullifier = BigInt('0x' + crypto.randomBytes(31).toString('hex'));
  const secret = BigInt('0x' + crypto.randomBytes(31).toString('hex'));
  
  // Calculate commitment from nullifier and secret
  const commitment = mimc.F.toString(mimc.multiHash([nullifier.toString(), secret.toString()]));
  
  // Calculate nullifier hash (used for verification)
  const nullifierHash = mimc.F.toString(mimc.multiHash([nullifier.toString()]));
  
  return {
    nullifier: nullifier.toString(),
    secret: secret.toString(),
    commitment: commitment,
    nullifierHash: nullifierHash
  };
}

// Recreate a commitment from existing nullifier and secret
async function recreateCommitment(nullifier, secret) {
  await initialize();
  
  // Calculate commitment from nullifier and secret
  const commitment = mimc.F.toString(mimc.multiHash([nullifier.toString(), secret.toString()]));
  
  // Calculate nullifier hash
  const nullifierHash = mimc.F.toString(mimc.multiHash([nullifier.toString()]));
  
  return {
    nullifier: nullifier.toString(),
    secret: secret.toString(),
    commitment: commitment,
    nullifierHash: nullifierHash
  };
}

// Calculate hash of two child nodes
function calculateHash(left, right) {
  return mimc.F.toString(mimc.multiHash([left.toString(), right.toString()]));
}

// Generate zero elements for the Merkle tree
function generateZeros() {
  const zeros = [];
  zeros[0] = BigInt('21663839004416932945382355908790599225266501822907911457504978515578255421292'); // ZERO_VALUE from the smart contract
  for (let i = 1; i <= TREE_LEVELS; i++) {
    zeros[i] = calculateHash(zeros[i - 1], zeros[i - 1]);
  }
  return zeros;
}

// Add a new commitment to the Merkle tree
async function addCommitment(commitment) {
  await initialize();
  
  // Get all existing commitments from the database
  const commitments = await merkleTreeModel.getAllCommitments();
  
  // Add new commitment
  commitments.push(commitment);
  
  // Calculate new Merkle root and path
  const result = calculateMerkleRootAndPath(commitments, commitment);
  
  // Save commitment to database
  await merkleTreeModel.saveCommitment(commitment);
  
  // Save new root to database
  await merkleTreeModel.saveRoot(result.root);
  
  return result.root;
}

// Calculate Merkle root and path for a given commitment
function calculateMerkleRootAndPath(elements, targetElement) {
  // Create zeros for empty nodes
  const zeros = generateZeros();
  
  // Create layers for the tree
  let layers = [];
  layers[0] = elements.slice();
  
  // Build the tree
  for (let level = 1; level <= TREE_LEVELS; level++) {
    layers[level] = [];
    for (let i = 0; i < Math.ceil(layers[level - 1].length / 2); i++) {
      const left = layers[level - 1][i * 2];
      const right = i * 2 + 1 < layers[level - 1].length ? layers[level - 1][i * 2 + 1] : zeros[level - 1];
      layers[level][i] = calculateHash(left, right);
    }
  }
  
  // Get the root
  const root = layers[TREE_LEVELS].length > 0 ? layers[TREE_LEVELS][0] : zeros[TREE_LEVELS];
  
  // Find the target element and compute its path
  let pathElements = [];
  let pathIndices = [];
  
  if (targetElement) {
    // Convert to string for safe comparison (BigInt gets stringified anyway)
    const targetStr = targetElement.toString();
    let index = layers[0].findIndex(el => el.toString() === targetStr);
    
    if (index !== -1) {
      for (let level = 0; level < TREE_LEVELS; level++) {
        pathIndices[level] = index % 2;
        pathElements[level] = (index ^ 1) < layers[level].length ? layers[level][index ^ 1] : zeros[level];
        index >>= 1;
      }
    }
  }
  
  return {
    root: root.toString(),
    pathElements: pathElements.map((v) => v.toString()),
    pathIndices: pathIndices.map((v) => v.toString())
  };
}

// Get the Merkle path for a commitment
async function getMerklePath(commitment) {
  await initialize();
  
  // Get all commitments
  const commitments = await merkleTreeModel.getAllCommitments();
  
  // Calculate root and path
  return calculateMerkleRootAndPath(commitments, commitment);
}

// Get current Merkle root
async function getMerkleRoot() {
  // Get latest root from database
  return await merkleTreeModel.getLatestRoot();
}

// Check if a commitment is in the tree
async function isCommitmentInTree(commitment) {
  const commitments = await merkleTreeModel.getAllCommitments();
  // Convert to strings for safe comparison
  const targetStr = commitment.toString();
  return commitments.some(c => c.toString() === targetStr);
}

// Generate ZK proof for voting
async function generateVotingProof(nullifier, secret, commitment) {
  await initialize();
  
  // Get Merkle path for this commitment
  const merklePath = await getMerklePath(commitment);
  
  if (!merklePath.pathElements.length) {
    throw new Error("Commitment not found in Merkle tree");
  }
  
  // Input for the ZK proof
  const input = {
    nullifier: nullifier,
    secret: secret,
    pathElements: merklePath.pathElements, 
    pathIndices: merklePath.pathIndices
  };
  
  try {
    // Generate the proof
    console.log("Generating ZK proof...");
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      WASM_PATH,
      ZKEY_PATH
    );
    
    // Convert proof for Solidity
    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    
    // Parse calldata - Modified to work with both ethers v5 and v6
    const argv = calldata
      .replace(/["[\]\s]/g, "")
      .split(",")
      .map((x) => {
        // Check if we have ethers.BigNumber (v5) or need to use bigint (v6)
        if (typeof ethers.BigNumber === 'function') {
          return ethers.BigNumber.from(x).toString();
        } else {
          // Handle ethers v6 - direct conversion to string
          return BigInt(x).toString();
        }
      });
    
    const a = [argv[0], argv[1]];
    const b = [
      [argv[2], argv[3]],
      [argv[4], argv[5]],
    ];
    const c = [argv[6], argv[7]];
    
    return {
      nullifierHash: publicSignals[0],
      root: publicSignals[1],
      proof_a: a,
      proof_b: b,
      proof_c: c
    };
  } catch (error) {
    console.error("Error generating proof:", error);
    throw new Error(`Failed to generate proof: ${error.message}`);
  }
}

// Export functions
module.exports = {
  initialize,
  generateCommitment,
  recreateCommitment,
  addCommitment,
  calculateMerkleRootAndPath,
  getMerklePath,
  getMerkleRoot,
  generateVotingProof,
  isCommitmentInTree
};