const sharp = require("sharp");
const path = require("path");
const { ERROR_MESSAGES } = require("../messages/errorMessages");

/**
 * @summary Preprocesses an image to enhance its quality for better OCR accuracy.
 * @description Converts the image to grayscale, normalizes its contrast, resizes it to 1000px width,
 * and saves the processed image as a new file.
 *
 * @param {string} filePath - The path to the original image file.
 * @returns {Promise<string>} The path to the processed image file.
 * @throws {Error} Throws an error if preprocessing fails.
 */
const preprocessImage = async (filePath) => {
  if (typeof filePath !== "string") {
    throw new Error("Image processing failed: Invalid file path");
  }

  // Construct the processed file path using the same directory and file name with a new suffix
  const { dir, name } = path.parse(filePath);
  const processedPath = path.join(dir, `${name}-processed.png`);

  try {
    await sharp(filePath)
      .grayscale() // Convert to grayscale
      .normalise() // Enhance contrast
      .resize(1000) // Resize to 1000px width for clarity
      .toFile(processedPath);
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
