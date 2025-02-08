const faceapi = require("../utilities/ir/faceApiSetup");
const loadImage = require("../utilities/ir/processing/loadImage");
const cropFace = require("../utilities/ir/processing/cropFace");
const { initializeModels } = require("../utilities/ir/models/initializeModels");
const { compareDescriptors } = require("../utilities/ir/compareDescriptors");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");

/**
 * Detects and extracts a face from an image file.
 *
 * @param {string} imagePath - Path to the image file.
 * @returns {Promise<string>} - The path to the cropped face image.
 */
const detectAndExtractFace = async (imagePath) => {
  try {
    console.log("[INFO]: imagepath islallala:", imagePath);
    const imgCanvas = await loadImage(imagePath);
    console.log("[INFO]: canvas:", imgCanvas);
    const detection = await faceapi
      .detectSingleFace(imgCanvas)
      .withFaceLandmarks();

    if (!detection) {
      throw new Error(ERROR_MESSAGES.IR.NO_FACE_DETECTED);
    }

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
 * Processes and compares two face images: selfie and ID card.
 *
 * @param {string} selfiePath - Path to the selfie image.
 * @param {string} idCardPath - Path to the ID card image.
 * @returns {Promise<boolean>} - True if faces match, otherwise false.
 */
const processAndCompareFaces = async (selfiePath, idCardPath) => {
  try {
    // Initialize the models
    await initializeModels();

    // Detect and crop the face from the selfie
    const croppedSelfiePath = await detectAndExtractFace(selfiePath);

    // Detect and crop the face from the ID card
    const croppedIDCardPath = await detectAndExtractFace(idCardPath);

    // Extract descriptors for the cropped images
    const selfieDescriptor = await extractDescriptor(croppedSelfiePath, {
      detector: new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }),
    });
    const idCardDescriptor = await extractDescriptor(croppedIDCardPath, {
      detector: new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.2,
      }),
    });

    // Compare descriptors
    return compareDescriptors(selfieDescriptor, idCardDescriptor);
  } catch (error) {
    console.error("[PROCESS_COMPARE_FACES_ERROR]:", error.message, {
      selfiePath,
      idCardPath,
    });
    throw new Error(ERROR_MESSAGES.IR.FACE_COMPARISON_FAILED);
  }
};

/**
 * Extracts a face descriptor from an image.
 *
 * @param {string} imagePath - Path to the image.
 * @param {object} options - Detection options for faceapi.
 * @returns {Promise<Float32Array>} - The face descriptor.
 */
const extractDescriptor = async (imagePath, options) => {
  try {
    const imgCanvas = await loadImage(imagePath);
    console.log(`[INFO]: Starting face detection for image: ${imagePath}`);
    console.log(`[INFO]: Detection options:`, options);
    const detection = await faceapi
      .detectSingleFace(imgCanvas, options.detector)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error(ERROR_MESSAGES.IR.NO_FACE_DETECTED);
    }

    return detection.descriptor;
  } catch (error) {
    console.error("[EXTRACT_DESCRIPTOR_ERROR]:", error.message, {
      imagePath,
    });
    throw error;
  }
};

module.exports = {
  detectAndExtractFace,
  processAndCompareFaces,
};
