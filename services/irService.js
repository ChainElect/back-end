const path = require("path");
const faceapi = require("../utilities/ir/faceApiSetup");
const loadImage = require("../utilities/ir/processing/loadImage");
const cropFace = require("../utilities/ir/processing/cropFace");
const extractDescriptor = require("../utilities/ir/extractDescriptor");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");

/**
 * @summary Detects and extracts a face from an image file.
 * @description Loads an image, performs face detection with landmarks,
 * and then crops the detected face using the bounding box provided by the detection.
 *
 * @param {string} imagePath - The file path of the image.
 * @returns {Promise<string>} Resolves with the file path of the cropped face image.
 * @throws {Error} Throws an error if no face is detected or cropping fails.
 */
const detectAndExtractFace = async (imagePath) => {
  try {
    // Load the image (should return a canvas or a compatible object)
    const imgCanvas = await loadImage(imagePath);

    // Perform face detection with landmarks (without the descriptor)
    const detection = await faceapi
      .detectSingleFace(imgCanvas)
      .withFaceLandmarks();

    // If no face is detected, throw an error with t`he standardized message
    if (!detection) {
      throw new Error(ERROR_MESSAGES.IR.NO_FACE_DETECTED);
    }

    // Retrieve the bounding box for cropping the face
    const faceRegion = detection.detection.box;
    const { dir, name } = path.parse(imagePath);
    const croppedFacePath = path.join(dir, `${name}-cropped.jpg`);

    // Crop the image using the detected bounding box and save the result
    await cropFace(imgCanvas, faceRegion, croppedFacePath);

    return croppedFacePath;
  } catch (error) {
    console.error("[DETECT_AND_EXTRACT_FACE_ERROR]:", error.message, {
      imagePath,
    });
    // Rethrow a generic error message for face extraction failures
    throw new Error(ERROR_MESSAGES.IR.FACE_EXTRACTION_FAILED);
  }
};

/**
 * @summary Extracts a face descriptor from a selfie image.
 * @description Uses a default confidence threshold appropriate for selfie images.
 *
 * @param {string} imagePath - The file path of the selfie image.
 * @returns {Promise<Float32Array>} Resolves with the face descriptor.
 * @throws {Error} Throws an error if face detection or extraction fails.
 */
const extractDescriptorFromSelfie = async (imagePath) => {
  // Selfies typically use a higher confidence threshold (0.5)
  return extractDescriptor(imagePath, 0.5);
};

/**
 * @summary Extracts a face descriptor from an ID card image.
 * @description Uses a slightly lower confidence threshold to accommodate different image qualities.
 *
 * @param {string} imagePath - The file path of the ID card image.
 * @returns {Promise<Float32Array>} Resolves with the face descriptor.
 * @throws {Error} Throws an error if face detection or extraction fails.
 */
const extractDescriptorFromIDCard = async (imagePath) => {
  // ID cards typically use a lower confidence threshold (0.4)
  return extractDescriptor(imagePath, 0.4);
};

module.exports = {
  detectAndExtractFace,
  extractDescriptorFromSelfie,
  extractDescriptorFromIDCard,
};
