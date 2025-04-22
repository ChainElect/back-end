const Sentry = require("@sentry/node");
const identityZkpBridgeService = require("../services/identityZkpBridgeService");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");
const { SUCCESS_MESSAGES } = require("../utilities/messages/successMessages");

// Complete registration process with ID verification and ZKP setup
exports.completeRegistration = async (req, res) => {
  const { frontPath, backPath, selfiePath } = req.body;
  
  if (!frontPath || !backPath || !selfiePath) {
    return res.status(400).json({
      success: false,
      message: "Front image, back image, and selfie are required."
    });
  }
  
  try {
    // Process registration through identity-ZKP bridge
    const credentials = await identityZkpBridgeService.registerVerifiedUser(
      frontPath, 
      backPath, 
      selfiePath
    );
    
    // Return ZKP credentials to user
    return res.status(200).json({
      success: true,
      message: SUCCESS_MESSAGES.AUTH.USER_REGISTERED,
      credentials
    });
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.COMMON.SERVER_ERROR,
      error: error.message
    });
  }
};