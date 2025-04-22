const express = require("express");
const router = express.Router();
const votingService = require("../services/votingService");
const zkpService = require("../services/zkpService");
const authMiddleware = require("../middlewares/authMiddleware");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");
const { SUCCESS_MESSAGES } = require("../utilities/messages/successMessages");

/**
 * @route POST /api/zkp/prepare-vote
 * @description Prepare ZK proof and vote data
 * @access Private (requires authentication)
 */
router.post("/prepare-vote", authMiddleware, async (req, res) => {
  try {
    const { electionId, partyId, userData } = req.body;

    if (!electionId || !partyId) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.MISSING_VOTE_PARAMETERS
      });
    }

    // Prepare vote data with ZKP
    const voteData = await votingService.prepareVote(electionId, partyId, userData);

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.VOTE_PREPARED,
      data: voteData
    });
  } catch (error) {
    console.error("Error preparing vote:", error);
    res.status(500).json({
      success: false,
      message: error.message || ERROR_MESSAGES.VOTE_PREPARATION_FAILED
    });
  }
});

/**
 * @route POST /api/zkp/cast-vote
 * @description Cast a vote using ZK proof
 * @access Private (requires authentication)
 */
router.post("/cast-vote", authMiddleware, async (req, res) => {
  try {
    const voteData = req.body;

    // Validate required data
    if (!voteData.electionId || !voteData.partyId || !voteData.nullifierHash || !voteData.root) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.INVALID_VOTE_DATA
      });
    }

    // Check if nullifier has been used
    const hasVoted = await votingService.hasVoted(voteData.nullifierHash);
    if (hasVoted) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.ALREADY_VOTED
      });
    }

    // Cast vote
    const result = await votingService.castVoteViaAPI(voteData);

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.VOTE_SUBMITTED,
      data: result
    });
  } catch (error) {
    console.error("Error casting vote:", error);
    res.status(500).json({
      success: false,
      message: error.message || ERROR_MESSAGES.VOTE_SUBMISSION_FAILED
    });
  }
});

/**
 * @route GET /api/zkp/status/:nullifierHash
 * @description Check if a nullifier has been used to vote
 * @access Public
 */
router.get("/status/:nullifierHash", async (req, res) => {
  try {
    const { nullifierHash } = req.params;

    // Check if nullifier has been used
    const hasVoted = await votingService.hasVoted(nullifierHash);

    res.json({
      success: true,
      hasVoted
    });
  } catch (error) {
    console.error("Error checking vote status:", error);
    res.status(500).json({
      success: false,
      message: error.message || ERROR_MESSAGES.VOTE_STATUS_CHECK_FAILED
    });
  }
});

/**
 * @route POST /api/zkp/generate-commitment
 * @description Generate a new commitment for testing
 * @access Private (requires authentication)
 */
router.post("/generate-commitment", authMiddleware, async (req, res) => {
  try {
    // Generate new commitment
    const commitment = await zkpService.generateCommitment();

    res.json({
      success: true,
      data: commitment
    });
  } catch (error) {
    console.error("Error generating commitment:", error);
    res.status(500).json({
      success: false,
      message: error.message || ERROR_MESSAGES.COMMITMENT_GENERATION_FAILED
    });
  }
});

module.exports = router;