const sharp = require("sharp");
const { ERROR_MESSAGES } = require("../messages/errorMessages");

/**
 * Preprocesses an image to enhance its quality for better OCR accuracy.
 *
 * This function performs the following steps:
 * - Converts the image to grayscale to reduce noise.
 * - Normalizes the image to improve contrast.
 * - Resizes the image to 1000px width for better clarity and consistency.
 * - Saves the processed image as a new file.
 *
 * @param {string} filePath - The path to the original image file to be processed.
 * @returns {Promise<string>} - The path to the processed image file.
 * @throws {Error} - Throws an error if the preprocessing fails.
 */
const preprocessImage = async (filePath) => {
  const processedPath = `${filePath}-processed.png`;

  try {
    await sharp(filePath)
      .grayscale() // Convert to grayscale
      .normalise() // Enhance contrast
      .resize(1000) // Resize to 1000px for clarity
      .toFile(processedPath); // Save processed image
    return processedPath;
  } catch (error) {
    console.error(`[PREPROCESS_IMAGE_ERROR]: ${error.message}`, {
      filePath,
      stack: error.stack,
    });
    throw new Error(ERROR_MESSAGES.OCR.IMAGE_PROCESSING_FAILED);
  }
};

module.exports = { preprocessImage };
