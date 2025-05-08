const Sentry = require("@sentry/node");
const votingService = require("../services/votingService");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");
const { SUCCESS_MESSAGES } = require("../utilities/messages/successMessages");

/**
 * Prepare vote data with ZKP
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
exports.prepareVote = async (req, res) => {
  const { electionId, partyId, userData } = req.body;

  if (!electionId || !partyId) {
    return res.status(400).json({
      success: false,
      message: "Election ID and party ID are required."
    });
  }

  if (!userData || !userData.nullifier || !userData.secret) {
    return res.status(400).json({
      success: false,
      message: "Missing ZKP credentials (nullifier and secret)."
    });
  }

  try {
    // Get party name to include in the response (optional)
    let partyName = "Unknown Party";
    try {
      const electionDetails = await votingService.getElectionDetails(electionId);
      const party = electionDetails.parties.find(p => p.id === partyId);
      if (party) {
        partyName = party.name;
      }
    } catch (error) {
      console.warn("Could not fetch party name:", error);
      // Continue anyway - party name is optional
    }

    // Prepare vote data with ZKP
    const voteData = await votingService.prepareVote(electionId, partyId, userData);

    // Add party name to the response
    voteData.partyName = partyName;

    return res.status(200).json({
      success: true,
      message: "Vote prepared successfully.",
      data: voteData
    });
  } catch (error) {
    console.error("Error preparing vote:", error);
    Sentry.captureException(error);

    return res.status(500).json({
      success: false,
      message: error.message || ERROR_MESSAGES.COMMON.SERVER_ERROR,
      error: error.message
    });
  }
};

/**
 * Cast a vote with ZKP
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
exports.castVote = async (req, res) => {
  const {
    electionId,
    partyId,
    nullifierHash,
    root,
    proof_a,
    proof_b,
    proof_c
  } = req.body;

  if (!electionId || !partyId || !nullifierHash || !root || !proof_a || !proof_b || !proof_c) {
    return res.status(400).json({
      success: false,
      message: "Missing required vote parameters."
    });
  }

  try {
    // Enhanced nullifier check with logging
    console.log(`Vote request received with nullifier: ${nullifierHash.substring(0, 15)}...`);

    // Check if user has already voted with this nullifier
    const hasVoted = await votingService.hasVoted(nullifierHash);

    if (hasVoted) {
      console.warn(`Rejected vote with already used nullifier: ${nullifierHash.substring(0, 15)}...`);
      return res.status(400).json({
        success: false,
        message: "You have already voted in this election."
      });
    }

    // Cast the vote
    const result = await votingService.castVote({
      electionId,
      partyId,
      nullifierHash,
      root,
      proof_a,
      proof_b,
      proof_c
    });

    return res.status(200).json({
      success: true,
      message: "Vote cast successfully.",
      data: result
    });
  } catch (error) {
    console.error("Error casting vote:", error);
    Sentry.captureException(error);

    // Handle specific error cases
    if (error.message.includes("already voted")) {
      return res.status(400).json({
        success: false,
        message: "You have already voted in this election."
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cast vote. Please try again.",
      error: error.message
    });
  }
};

/**
 * Get election details
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
exports.getElectionDetails = async (req, res) => {
  const { electionId } = req.params;

  if (!electionId) {
    return res.status(400).json({
      success: false,
      message: "Election ID is required."
    });
  }

  try {
    const electionDetails = await votingService.getElectionDetails(electionId);

    return res.status(200).json({
      success: true,
      data: electionDetails
    });
  } catch (error) {
    console.error("Error getting election details:", error);
    Sentry.captureException(error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve election details.",
      error: error.message
    });
  }
};

/**
 * Get election results
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
exports.getElectionResults = async (req, res) => {
  const { electionId } = req.params;

  if (!electionId) {
    return res.status(400).json({
      success: false,
      message: "Election ID is required."
    });
  }

  try {
    const results = await votingService.getElectionResults(electionId);

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("Error getting election results:", error);
    Sentry.captureException(error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve election results.",
      error: error.message
    });
  }
};

/**
 * Get all ongoing elections
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
exports.getOngoingElections = async (req, res) => {
  try {
    const elections = await votingService.getOngoingElections();

    return res.status(200).json({
      success: true,
      data: elections
    });
  } catch (error) {
    console.error("Error getting ongoing elections:", error);
    Sentry.captureException(error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve ongoing elections.",
      error: error.message
    });
  }
};