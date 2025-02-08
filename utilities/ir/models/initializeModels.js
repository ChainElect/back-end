const faceapi = require("face-api.js");
const { ERROR_MESSAGES } = require("../../messages/errorMessages");
const MODEL_PATHS = require("../models/modelPaths");

/**
 * Initializes face recognition models by loading them from disk.
 *
 * @throws {Error} - Throws an error if any model fails to load.
 */
const initializeModels = async () => {
  try {
    // Load models required for face recognition and detection
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATHS.ssdMobilenetv1); // For selfies
    await faceapi.nets.tinyFaceDetector.loadFromDisk(
      MODEL_PATHS.tinyFaceDetector
    ); // For ID cards
    await faceapi.nets.faceLandmark68Net.loadFromDisk(
      MODEL_PATHS.faceLandmark68
    );
    await faceapi.nets.faceRecognitionNet.loadFromDisk(
      MODEL_PATHS.faceRecognition
    );

    console.log("All models loaded successfully.");
  } catch (error) {
    console.error("[MODEL_INITIALIZATION_ERROR]:", error);
    throw new Error(ERROR_MESSAGES.IR.MODEL_INITIALIZATION_FAILED);
  }
};

module.exports = { initializeModels };
