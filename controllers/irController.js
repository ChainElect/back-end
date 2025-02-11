/**
 * @module irController
 * @description Controller for handling image recognition (IR) operations,
 * including face image uploads and face matching.
 */

const Sentry = require("@sentry/node");
const {
  extractDescriptorFromSelfie,
  extractDescriptorFromIDCard,
} = require("../services/irService");
const { compareDescriptors } = require("../utilities/ir/compareDescriptors");
const { initializeModels } = require("../utilities/ir/models/initializeModels");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");
const { SUCCESS_MESSAGES } = require("../utilities/messages/successMessages");

exports.uploadFaceImage = (req, res) => {
  const filePath = req.file?.path;
  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: ERROR_MESSAGES.IR.FACE_IMAGE_REQUIRED,
    });
  }
  res.json({ success: true, filePath });
};

exports.matchFace = async (req, res) => {
  const { selfieFacePath, idCardFacePath } = req.body;
  if (!selfieFacePath || !idCardFacePath) {
    return res.status(400).json({
      success: false,
      message: ERROR_MESSAGES.IR.IMAGE_PATHS_REQUIRED,
    });
  }
  try {
    await initializeModels();
    const selfieDescriptor = await extractDescriptorFromSelfie(selfieFacePath);
    const idCardDescriptor = await extractDescriptorFromIDCard(idCardFacePath);
    const isMatch = compareDescriptors(selfieDescriptor, idCardDescriptor);
    if (isMatch) {
      return res.json({
        success: true,
        message: SUCCESS_MESSAGES.IR.FACE_MATCHED,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.IR.FACE_NOT_MATCHED,
      });
    }
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.IR.FACE_MATCHING_FAILED,
      error: error.message,
    });
  }
};
