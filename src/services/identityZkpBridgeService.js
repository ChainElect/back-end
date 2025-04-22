const irService = require("./irService");
const ocrService = require("./ocrService");
const zkpService = require("./zkpService");
const userModel = require("../models/userModel");

// Register a new user after successful ID verification
async function registerVerifiedUser(frontPath, backPath, selfiePath) {
  try {
    // Step 1: Extract data from ID (OCR)
    const mrzText = await ocrService.extractMRZ(backPath);
    const idData = await ocrService.parseMRZ(mrzText);
    
    // Step 2: Extract face from ID
    const idFacePath = await irService.detectAndExtractFace(frontPath);
    
    // Step 3: Compare faces
    const selfieDescriptor = await irService.extractDescriptorFromSelfie(selfiePath);
    const idDescriptor = await irService.extractDescriptorFromIDCard(idFacePath);
    const facesMatch = irService.compareDescriptors(selfieDescriptor, idDescriptor);
    
    if (!facesMatch) {
      throw new Error("Face verification failed");
    }
    
    // Step 4: Generate ZKP commitment
    const commitment = await zkpService.generateCommitment();
    
    // Step 5: Add commitment to Merkle tree
    await zkpService.addCommitment(commitment.commitment);
    
    // Step 6: Store user data in database
    await userModel.saveUser({
      name: idData.name,
      dob: idData.dob,
      idNumber: idData.documentNumber,
      commitmentHash: commitment.commitment // Store commitment for reference
    });
    
    // Step 7: Return credentials to user
    return {
      nullifier: commitment.nullifier,
      secret: commitment.secret
    };
  } catch (error) {
    console.error("[REGISTRATION_ERROR]:", error);
    throw error;
  }
}

// Prepare voting data with ZKP
async function prepareVoteData(nullifier, secret, electionId, partyId) {
  try {
    // Step 1: Recalculate commitment from nullifier and secret
    const mimc = await buildMimcSponge();
    const commitment = mimc.F.toString(mimc.multiHash([nullifier.toString(), secret.toString()]));
    
    // Step 2: Verify commitment is in tree
    if (!zkpService.isCommitmentInTree(commitment)) {
      throw new Error("Voter is not registered");
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