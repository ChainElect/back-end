const Sentry = require("@sentry/node");
const identityZkpBridgeService = require("../services/identityZkpBridgeService");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");
const { SUCCESS_MESSAGES } = require("../utilities/messages/successMessages");
const fs = require("fs");

/**
 * Complete registration and generate ZKP credentials
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
exports.completeRegistration = async (req, res) => {
  const { frontPath, backPath, selfiePath } = req.body;
  
  if (!frontPath || !backPath || !selfiePath) {
    return res.status(400).json({
      success: false,
      message: "Front image, back image, and selfie are required."
    });
  }
  
  // Validate that files exist
  try {
    if (!fs.existsSync(frontPath) || !fs.existsSync(backPath) || !fs.existsSync(selfiePath)) {
      return res.status(400).json({
        success: false,
        message: "One or more of the provided files could not be found."
      });
    }
  } catch (error) {
    console.error("Error checking files:", error);
    return res.status(500).json({
      success: false,
      message: "Error validating file paths."
    });
  }
  
  try {
    // Process registration through identity-ZKP bridge
    const result = await identityZkpBridgeService.registerVerifiedUser(
      frontPath, 
      backPath, 
      selfiePath
    );
    
    // Return ZKP credentials to user
    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.AUTH.USER_REGISTERED,
      credentials: {
        nullifier: result.nullifier,
        secret: result.secret,
        userData: result.userData
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    Sentry.captureException(error);
    
    // Return appropriate error message
    let errorMessage = ERROR_MESSAGES.COMMON.SERVER_ERROR;
    if (error.message.includes("Face verification failed")) {
      errorMessage = "Face verification failed. The selfie does not match the ID photo.";
    } else if (error.message.includes("OCR")) {
      errorMessage = "Could not read the ID card correctly. Please ensure the image is clear.";
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  } finally {
    // Clean up temporary files if necessary
    try {
      // Only remove files if they're in the temp/uploads directory to avoid deleting important files
      if (frontPath.includes("uploads/")) {
        fs.unlinkSync(frontPath);
      }
      if (backPath.includes("uploads/")) {
        fs.unlinkSync(backPath);
      }
      if (selfiePath.includes("uploads/")) {
        fs.unlinkSync(selfiePath);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up files:", cleanupError);
    }
  }
};

/**
 * Store user preferences along with ZKP credentials
 * @param {object} req - The request object
 * @param {object} res - The response object 
 */
exports.storeUserPreferences = async (req, res) => {
  const { email, language, nullifier, secret } = req.body;
  
  if (!nullifier || !secret) {
    return res.status(400).json({
      success: false,
      message: "Missing ZKP credentials (nullifier and secret)."
    });
  }
  
  try {
    // Here you could store user preferences in the database
    // This could include email subscriptions, notification preferences, etc.
    // For now, we'll just acknowledge the request
    
    return res.status(200).json({
      success: true,
      message: "User preferences stored successfully.",
    });
  } catch (error) {
    console.error("Error storing user preferences:", error);
    Sentry.captureException(error);
    
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.COMMON.SERVER_ERROR,
      error: error.message
    });
  }
};

/**
 * Check if a user has registered ZKP credentials
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
exports.checkCredentials = async (req, res) => {
  // In a real implementation, you might check if the provided credentials
  // exist in your system, or if a user has previously registered
  // For simplicity, we'll just check if the request has valid credential format
  
  const { nullifier, secret } = req.body;
  
  if (!nullifier || !secret) {
    return res.status(400).json({
      success: false,
      message: "Missing ZKP credentials (nullifier and secret)."
    });
  }
  
  try {
    // Validate credential format
    if (nullifier.length < 10 || secret.length < 10) {
      return res.status(400).json({
        success: false, 
        message: "Invalid credential format."
      });
    }
    
    // In a real implementation, you'd verify these against your database
    // or the Merkle tree
    
    return res.status(200).json({
      success: true,
      message: "Valid credentials found.",
      isRegistered: true
    });
  } catch (error) {
    console.error("Error checking credentials:", error);
    Sentry.captureException(error);
    
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.COMMON.SERVER_ERROR,
      error: error.message
    });
  }
};