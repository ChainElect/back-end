// irService.js

const faceapi = require("../utilities/ir/faceApiSetup");
const loadImage = require("../utilities/ir/processing/loadImage");
const cropFace = require("../utilities/ir/processing/cropFace");
const { initializeModels } = require("../utilities/ir/models/initializeModels");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");

/**
 * Detects and extracts a face from an image file.
 *
 * @param {string} imagePath - Path to the image file.
 * @returns {Promise<string>} - The path to the cropped face image.
 */
const detectAndExtractFace = async (imagePath) => {
  try {
    // Load the image (this should return a canvas or compatible object)
    const imgCanvas = await loadImage(imagePath);
    // Run face detection with landmarks (without the descriptor)
    const detection = await faceapi
      .detectSingleFace(imgCanvas)
      .withFaceLandmarks();

    if (!detection) {
      throw new Error(ERROR_MESSAGES.IR.NO_FACE_DETECTED);
    }

    // Use the bounding box to crop the face
    const faceRegion = detection.detection.box;
    const croppedFacePath = `${imagePath}-cropped.jpg`;

    await cropFace(imgCanvas, faceRegion, croppedFacePath);
    return croppedFacePath;
  } catch (error) {
    console.error("[DETECT_AND_EXTRACT_FACE_ERROR]:", error.message, {
      imagePath,
    });
    throw new Error(ERROR_MESSAGES.IR.FACE_EXTRACTION_FAILED);
  }
};

/**
 * Extracts a face descriptor from a selfie image.
 *
 * @param {string} imagePath - Path to the selfie image.
 * @returns {Promise<Float32Array>} - The face descriptor.
 */
const extractDescriptorFromSelfie = async (imagePath) => {
  try {
    const imgCanvas = await loadImage(imagePath);
    console.log(`Selfie loaded successfully: ${imagePath}`);

    const detection = await faceapi
      .detectSingleFace(
        imgCanvas,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error("No face detected in the selfie.");
    }

    console.log("Selfie detection box:", detection.detection.box);
    return detection.descriptor;
  } catch (error) {
    console.error("Selfie face descriptor extraction failed:", error);
    throw error;
  }
};

/**
 * Extracts a face descriptor from an ID card image.
 *
 * @param {string} imagePath - Path to the ID card image.
 * @returns {Promise<Float32Array>} - The face descriptor.
 */
const extractDescriptorFromIDCard = async (imagePath) => {
  try {
    const imgCanvas = await loadImage(imagePath);
    console.log(`ID card loaded successfully: ${imagePath}`);

    const detection = await faceapi
      .detectSingleFace(
        imgCanvas,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error("No face detected in the ID card.");
    }

    console.log("ID card detection box:", detection.detection.box);
    return detection.descriptor;
  } catch (error) {
    console.error("ID card face descriptor extraction failed:", error);
    throw error;
  }
};

/**
 * Compares two face descriptors using Euclidean distance.
 *
 * @param {Float32Array} descriptor1 - First face descriptor.
 * @param {Float32Array} descriptor2 - Second face descriptor.
 * @param {number} [threshold=0.6] - Matching threshold.
 * @returns {boolean} - True if the descriptors match (distance below threshold), else false.
 */
const compareDescriptorsFn = (descriptor1, descriptor2, threshold = 0.6) => {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  console.log(`Distance between descriptors: ${distance}`);
  return distance < threshold;
};

module.exports = {
  detectAndExtractFace,
  extractDescriptorFromSelfie,
  extractDescriptorFromIDCard,
  compareDescriptors: compareDescriptorsFn,
};
