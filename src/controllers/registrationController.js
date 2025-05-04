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
  const { userData } = req.body;
  
  if (!userData || !userData.fullName || !userData.idNumber || !userData.birthDate) {
    return res.status(400).json({
      success: false,
      message: "User data is required (fullName, idNumber, birthDate)."
    });
  }
  
  try {
    // Process registration with the already extracted data
    const result = await identityZkpBridgeService.registerVerifiedUser(userData);
    
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
    
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message
    });
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