const faceapi = require("./faceApiSetup");
const loadImage = require("./processing/loadImage");
const { ERROR_MESSAGES } = require("../../utilities/messages/errorMessages");

/**
 * @summary Extracts a face descriptor from an image.
 * @description Loads an image, performs face detection with landmarks and descriptor,
 * and returns the face descriptor if detection is successful.
 *
 * @param {string} imagePath - The file path of the image.
 * @param {number} minConfidence - The minimum confidence level for detection.
 * @returns {Promise<Float32Array>} Resolves with the face descriptor.
 * @throws {Error} Throws an error if no face is detected or descriptor extraction fails.
 */
const extractDescriptor = async (imagePath, minConfidence) => {
  try {
    const imgCanvas = await loadImage(imagePath);
    console.log(`Image loaded successfully: ${imagePath}`);

    const detection = await faceapi
      .detectSingleFace(
        imgCanvas,
        new faceapi.SsdMobilenetv1Options({ minConfidence })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error(ERROR_MESSAGES.IR.NO_FACE_DETECTED);
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("Detection box:", detection.detection.box);
    }
    return detection.descriptor;
  } catch (error) {
    console.error("[EXTRACT_DESCRIPTOR_ERROR]:", error.message, { imagePath });
    throw new Error(ERROR_MESSAGES.IR.FACE_EXTRACTION_FAILED);
  }
};

module.exports = extractDescriptor;
