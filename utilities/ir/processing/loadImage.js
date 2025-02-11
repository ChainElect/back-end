const fs = require("fs");
const { ERROR_MESSAGES } = require("../../messages/errorMessages");
const { loadImage } = require("canvas");
const faceapi = require("../faceApiSetup");
/**
 * Loads and preprocesses an image for further processing.
 *
 * @param {string} imagePath - The path to the image file.
 * @returns {Promise<Image>} - A promise that resolves to a Canvas Image object.
 * @throws {Error} - Throws an error if the image cannot be found or loaded.
 */
const loadImageUtility = async (imagePath) => {
  try {
    // Validate if the file exists at the given path
    if (!fs.existsSync(imagePath)) {
      console.error(`[IMAGE_NOT_FOUND]: ${imagePath}`);
      throw new Error(ERROR_MESSAGES.IR.IMAGE_NOT_FOUND(imagePath));
    }

    // Attempt to load the image using the canvas package
    const image = await loadImage(imagePath);
    return faceapi.createCanvasFromMedia(image);
  } catch (error) {
    // Log the specific error for debugging
    console.error("[IMAGE_LOAD_ERROR]:", error.message, { path: imagePath });
    throw new Error(ERROR_MESSAGES.IR.IMAGE_PREPROCESSING_FAILED);
  }
};

module.exports = loadImageUtility;
