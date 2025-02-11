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

exports.uploadFaceImage = (req, res) => {
  const filePath = req.file?.path;
  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: "Face image is required.",
    });
  }
  res.json({ success: true, filePath });
};

exports.matchFace = async (req, res) => {
  const { selfieFacePath, idCardFacePath } = req.body;
  if (!selfieFacePath || !idCardFacePath) {
    return res.status(400).json({
      success: false,
      message: "Both selfie and ID card face image paths are required.",
    });
  }
  try {
    // Note: If model initialization is expensive, consider calling initializeModels once at startup.
    await initializeModels();
    const selfieDescriptor = await extractDescriptorFromSelfie(selfieFacePath);
    const idCardDescriptor = await extractDescriptorFromIDCard(idCardFacePath);
    const isMatch = compareDescriptors(selfieDescriptor, idCardDescriptor);
    if (isMatch) {
      return res.json({ success: true, message: "Face matched successfully" });
    } else {
      return res.status(400).json({
        success: false,
        message: "Face does not match the ID photo.",
      });
    }
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json({
      success: false,
      message: "Face matching failed.",
      error: error.message,
    });
  }
};
