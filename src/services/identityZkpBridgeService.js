const irService = require("./irService");
const ocrService = require("./ocrService");
const zkpService = require("./zkpService");
const userModel = require("../models/userModel");
const { buildMimcSponge } = require("circomlibjs");

/**
 * Register a verified user and create ZKP credentials
 * @param {Object} userData - User data object containing fullName, idNumber, birthDate
 * @returns {Promise<Object>} ZKP credentials (nullifier, secret)
 */
async function registerVerifiedUser(userData) {
  try {
    // Step 1: Generate ZKP commitment
    const commitment = await zkpService.generateCommitment();
    
    // Step 2: Add commitment to Merkle tree
    await zkpService.addCommitment(commitment.commitment);
    
    // Step 3: Store user data in database
    await userModel.saveUser({
      name: userData.fullName,
      dob: userData.birthDate,
      idNumber: userData.idNumber,
      // Store commitment hash for reference (optional)
      commitmentHash: commitment.commitment
    });
    
    // Step 4: Return credentials to user
    return {
      nullifier: commitment.nullifier,
      secret: commitment.secret,
      // Include the user data back
      userData: userData
    };
  } catch (error) {
    console.error("[REGISTRATION_ERROR]:", error);
    throw error;
  }
}

/**
 * Prepare voting data with ZKP
 * @param {string} nullifier - User's nullifier
 * @param {string} secret - User's secret
 * @param {string} electionId - ID of the election
 * @param {string} partyId - ID of the party being voted for
 * @returns {Promise<Object>} ZKP and voting data
 */
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

/**
 * Helper function to format date from MRZ format (YYMMDD) to ISO format (YYYY-MM-DD)
 * @param {string} mrzDate - Date in MRZ format
 * @returns {string} Formatted date
 */
function formatDate(mrzDate) {
  if (!mrzDate || mrzDate.length !== 6) {
    return null;
  }
  
  const year = mrzDate.substring(0, 2);
  const month = mrzDate.substring(2, 4);
  const day = mrzDate.substring(4, 6);
  
  // Determine century (19xx or 20xx)
  const century = parseInt(year) >= 50 ? "19" : "20";
  
  return `${century}${year}-${month}-${day}`;
}

module.exports = {
  registerVerifiedUser,
  prepareVoteData
};