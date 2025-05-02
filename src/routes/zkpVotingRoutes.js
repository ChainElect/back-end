const express = require("express");
const router = express.Router();
const voteController = require("../controllers/voteController");
const registrationController = require("../controllers/registrationController");
const authMiddleware = require("../middlewares/authMiddleware");
const votingService = require("../services/votingService");
const zkpService = require("../services/zkpService");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");
const { SUCCESS_MESSAGES } = require("../utilities/messages/successMessages");

/**
 * @route POST /api/zkp/register
 * @description Complete registration and generate ZKP credentials
 * @access Private
 */
// remove authMiddleware for testing
router.post("/register", registrationController.completeRegistration);

/**
 * @route POST /api/zkp/preferences
 * @description Store user preferences
 * @access Private
 */
router.post("/preferences", authMiddleware, registrationController.storeUserPreferences);

/**
 * @route POST /api/zkp/check-credentials
 * @description Check if user has valid ZKP credentials
 * @access Private
 */
router.post("/check-credentials", authMiddleware, registrationController.checkCredentials);

/**
 * @route POST /api/zkp/prepare-vote
 * @description Prepare ZK proof and vote data
 * @access Private
 */
router.post("/prepare-vote", authMiddleware, async (req, res) => {
  try {
    const { electionId, partyId, userData } = req.body;

    if (!electionId || !partyId) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES?.MISSING_VOTE_PARAMETERS || "Missing vote parameters"
      });
    }

    const voteData = await votingService.prepareVote(electionId, partyId, userData);

    res.json({
      success: true,
      message: SUCCESS_MESSAGES?.VOTE_PREPARED || "Vote prepared successfully",
      data: voteData
    });
  } catch (error) {
    console.error("Error preparing vote:", error);
    res.status(500).json({
      success: false,
      message: error.message || ERROR_MESSAGES?.VOTE_PREPARATION_FAILED || "Vote preparation failed"
    });
  }
});

/**
 * @route POST /api/zkp/cast-vote
 * @description Cast a vote using ZK proof
 * @access Private
 */
router.post("/cast-vote", authMiddleware, async (req, res) => {
  try {
    const voteData = req.body;

    if (!voteData.electionId || !voteData.partyId || !voteData.nullifierHash || !voteData.root) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES?.INVALID_VOTE_DATA || "Invalid vote data"
      });
    }

    const hasVoted = await votingService.hasVoted(voteData.nullifierHash);
    if (hasVoted) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES?.ALREADY_VOTED || "Vote already cast"
      });
    }

    const result = await votingService.castVoteViaAPI(voteData);

    res.json({
      success: true,
      message: SUCCESS_MESSAGES?.VOTE_SUBMITTED || "Vote submitted successfully",
      data: result
    });
  } catch (error) {
    console.error("Error casting vote:", error);
    res.status(500).json({
      success: false,
      message: error.message || ERROR_MESSAGES?.VOTE_SUBMISSION_FAILED || "Vote submission failed"
    });
  }
});

/**
 * @route GET /api/zkp/elections/:electionId
 * @description Get election details
 * @access Public
 */
router.get("/elections/:electionId", voteController.getElectionDetails);

/**
 * @route GET /api/zkp/elections/:electionId/results
 * @description Get election results
 * @access Public
 */
router.get("/elections/:electionId/results", voteController.getElectionResults);

/**
 * @route GET /api/zkp/elections
 * @description Get all ongoing elections
 * @access Public
 */
router.get("/elections", voteController.getOngoingElections);

/**
 * @route GET /api/zkp/check-vote/:nullifierHash
 * @description Check if a nullifier hash has been used to vote
 * @access Public
 */
router.get("/check-vote/:nullifierHash", async (req, res) => {
  try {
    const { nullifierHash } = req.params;
    const hasVoted = await votingService.hasVoted(nullifierHash);

    res.status(200).json({
      success: true,
      hasVoted
    });
  } catch (error) {
    console.error("Error checking vote status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check vote status.",
      error: error.message
    });
  }
});

/**
 * @route GET /api/zkp/status/:nullifierHash
 * @description Check if a nullifier has been used to vote (alias route)
 * @access Public
 */
router.get("/status/:nullifierHash", async (req, res) => {
  try {
    const { nullifierHash } = req.params;
    const hasVoted = await votingService.hasVoted(nullifierHash);

    res.json({
      success: true,
      hasVoted
    });
  } catch (error) {
    console.error("Error checking vote status:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check vote status"
    });
  }
});

/**
 * @route POST /api/zkp/generate-commitment
 * @description Generate a new commitment for testing
 * @access Private
 */
router.post("/generate-commitment", authMiddleware, async (req, res) => {
  try {
    const commitment = await zkpService.generateCommitment();

    res.json({
      success: true,
      data: commitment
    });
  } catch (error) {
    console.error("Error generating commitment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Commitment generation failed"
    });
  }
});

module.exports = router;
