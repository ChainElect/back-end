const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registrationController");
const authMiddleware = require("../middlewares/authMiddleware");
const zkpService = require("../services/zkpService");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");
const { SUCCESS_MESSAGES } = require("../utilities/messages/successMessages");

/**
 * @route POST /api/zkp/register
 * @description Complete registration and generate ZKP credentials
 * @access Public
 */
router.post("/register", registrationController.completeRegistration);

/**
 * @route POST /api/zkp/check-credentials
 * @description Check if user has valid ZKP credentials
 * @access Private
 */
router.post("/check-credentials", authMiddleware, registrationController.checkCredentials);

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