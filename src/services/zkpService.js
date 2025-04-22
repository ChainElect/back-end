// src/services/zkpService.js
const { ethers } = require("ethers");
const { buildMimcSponge } = require("circomlibjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");
const merkleTreeService = require("./merkleTreeService");

// Constants
const TREE_LEVELS = 20;
const ZKEY_PATH = path.join(__dirname, "../../circuits/build/Verifier.zkey");
const WASM_PATH = path.join(__dirname, "../../circuits/build/Verifier_js/Verifier.wasm");

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

// Add a new commitment to the Merkle tree
async function addCommitment(commitment, userId = null) {
  await initialize();
  
  // Use the merkleTreeService to add the commitment
  const newRoot = await merkleTreeService.addCommitment(commitment, userId);
  
  return newRoot;
}

// Generate ZK proof for voting
async function generateVotingProof(nullifier, secret, commitment) {
  await initialize();
  
  // Get Merkle path for this commitment
  const merklePath = await merkleTreeService.getMerklePath(commitment);
  
  if (!merklePath) {
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
    
    // Convert proof to solidity calldata format
    const calldata = await snarkjs.groth16.exportSolidityCallData(proof, publicSignals);
    
    // Parse calldata
    const argv = calldata
      .replace(/["[\]\s]/g, "")
      .split(",")
      .map((x) => ethers.BigNumber.from(x).toString());
    
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

// Verify proof using verification key
async function verifyProof(proof, publicSignals) {
  try {
    // Load verification key
    const vKey = JSON.parse(fs.readFileSync(
      path.join(__dirname, '../../circuits/build/verification_key.json')
    ));
    
    // Verify the proof
    const result = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    return result;
  } catch (error) {
    console.error("Error verifying proof:", error);
    return false;
  }
}

// Verify a commitment is in the tree
async function isCommitmentInTree(commitment) {
  return await merkleTreeService.isCommitmentInTree(commitment);
}

// Get current Merkle root
async function getMerkleRoot() {
  return await merkleTreeService.getMerkleRoot();
}

// Export functions
module.exports = {
  initialize,
  generateCommitment,
  addCommitment,
  generateVotingProof,
  verifyProof,
  isCommitmentInTree,
  getMerkleRoot
};