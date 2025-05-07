const irService = require("./irService");
const ocrService = require("./ocrService");
const zkpService = require("./zkpService");
const userModel = require("../models/userModel");
const { buildMimcSponge } = require("circomlibjs");

async function registerVerifiedUser(userData) {
  try {
    console.log("registerVerifiedUser", userData);
    // Step 1: Generate ZKP commitment
    const commitment = await zkpService.generateCommitment();
    const mimcSponge = await buildMimcSponge();
    // Step 2: Add commitment to Merkle tree
    await zkpService.addCommitment(commitment.commitment);

    // Step 3: Store user data in database
    await userModel.saveUser({
      commitment: userData.commitment_hash,
      password: userData.password,
      is_admin: userData.is_admin || false
    });
    
    // Step 4: Return credentials to user
    return {
      nullifier: commitment.nullifier,
      secret: commitment.secret,
      userData: userData
    };
  } catch (error) {
    console.error("[REGISTRATION_ERROR]:", error);
    throw error;
  }
}

async function prepareVoteData(nullifier, secret, electionId, partyId) {
  try {
    // Step 1: Recreate commitment from nullifier and secret
    const commitmentData = await zkpService.recreateCommitment(nullifier, secret);
    const commitment = commitmentData.commitment;

    // Step 2: Verify commitment is in tree
    const isRegistered = await zkpService.isCommitmentInTree(commitment);
    if (!isRegistered) {
      throw new Error("Voter is not registered. Commitment not found in Merkle tree.");
    }

    // Step 3: Generate ZK proof
    const zkProof = await zkpService.generateVotingProof(nullifier, secret, commitment);

    // Step 4: Return voting data
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
    console.error("[PREPARE_VOTE_ERROR]:", error);
    throw error;
  }
}

module.exports = {
  registerVerifiedUser,
  prepareVoteData
};