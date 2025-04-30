const irService = require("./irService");
const ocrService = require("./ocrService");
const zkpService = require("./zkpService");
const userModel = require("../models/userModel");
const { buildMimcSponge } = require("circomlibjs");

/**
 * Register a verified user and create ZKP credentials
 * @param {string} frontPath - Path to front of ID card image
 * @param {string} backPath - Path to back of ID card image
 * @param {string} selfiePath - Path to selfie image
 * @returns {Promise<Object>} ZKP credentials (nullifier, secret)
 */
async function registerVerifiedUser(frontPath, backPath, selfiePath) {
  try {
    // Step 1: Extract data from ID (OCR)
    const mrzText = await ocrService.extractMRZ(backPath);
    const idData = await ocrService.parseMRZ(mrzText);
    
    // Step 2: Extract faces from ID and selfie
    const idFacePath = await irService.detectAndExtractFace(frontPath);
    
    // Step 3: Compare faces for verification
    const selfieDescriptor = await irService.extractDescriptorFromSelfie(selfiePath);
    const idDescriptor = await irService.extractDescriptorFromIDCard(idFacePath);
    const facesMatch = await irService.compareDescriptors(selfieDescriptor, idDescriptor);
    
    if (!facesMatch) {
      throw new Error("Face verification failed. The selfie does not match the ID photo.");
    }
    
    // Step 4: Generate ZKP commitment
    const commitment = await zkpService.generateCommitment();
    
    // Step 5: Add commitment to Merkle tree
    await zkpService.addCommitment(commitment.commitment);
    
    // Step 6: Store user data in database
    await userModel.saveUser({
      name: `${idData.surname} ${idData.name}`,
      dob: formatDate(idData.dob),
      idNumber: idData.documentNumber,
      // Store commitment hash for reference (optional)
      commitmentHash: commitment.commitment
    });
    
    // Step 7: Return credentials to user
    return {
      nullifier: commitment.nullifier,
      secret: commitment.secret,
      // Include additional information for the frontend
      userData: {
        fullName: `${idData.surname} ${idData.name}`,
        idNumber: idData.documentNumber,
        dob: formatDate(idData.dob)
      }
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