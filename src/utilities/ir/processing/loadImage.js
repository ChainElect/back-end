const fs = require("fs");
const { ERROR_MESSAGES } = require("../../messages/errorMessages");
const { loadImage } = require("canvas");
const faceapi = require("../faceApiSetup");

/**
 * @summary Loads and preprocesses an image for further processing.
 * @description Validates the image path, loads the image using the canvas package,
 * and creates a canvas image from the loaded image using faceapi.
 *
 * @param {string} imagePath - The path to the image file.
 * @returns {Promise<Image>} A promise that resolves to a Canvas Image object.
 * @throws {Error} Throws an error if the image cannot be found or loaded.
 */
const loadImageUtility = async (imagePath) => {
  try {
    // Check if the file exists at the given path
    if (!fs.existsSync(imagePath)) {
      console.error(`[IMAGE_NOT_FOUND]: ${imagePath}`);
      throw new Error(ERROR_MESSAGES.IR.IMAGE_NOT_FOUND(imagePath));
    }

    // Load the image using the canvas package and create a canvas image
    const image = await loadImage(imagePath);
    return faceapi.createCanvasFromMedia(image);
  } catch (error) {
    console.error("[IMAGE_LOAD_ERROR]:", error.message, { path: imagePath });
    throw new Error(ERROR_MESSAGES.IR.IMAGE_PREPROCESSING_FAILED);
  }
};

module.exports = loadImageUtility;
