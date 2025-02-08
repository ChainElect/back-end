const Tesseract = require("tesseract.js"); // OCR library for extracting text from images
const fs = require("fs"); // File system module for file operations
const { preprocessImage } = require("../utilities/ocr/preprocessImage"); // Preprocessing utility for enhancing image quality
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages"); // Standardized error messages

/**
 * Perform OCR (Optical Character Recognition) on an image file.
 *
 * This function preprocesses the image, performs OCR using Tesseract.js, and extracts the text from the image.
 *
 * @param {string} filePath - The path to the image file to be processed.
 * @returns {Promise<string>} - The extracted text from the image.
 * @throws {Error} - Throws an error if OCR fails or the image cannot be processed.
 */

// Perform OCR on the preprocessed image
const performOCR = async (filePath) => {
  try {
    // Preprocess the image for better OCR accuracy
    const processedPath = await preprocessImage(filePath);
    const tessdataPath = "/app/tessdata"; // Path to the Tesseract language data

    // Perform OCR using Tesseract.js
    const {
      data: { text },
    } = await Tesseract.recognize(processedPath, "eng", {
      langPath: tessdataPath, // Specify custom language data path
    });

    // Remove the processed image file after OCR
    fs.unlinkSync(processedPath);

    // Return the extracted text
    return text;
  } catch (error) {
    // Log the error for debugging
    console.error(`[OCR_ERROR]: ${error.message}`, {
      filePath,
      stack: error.stack,
    });

    // Throw a user-friendly error message
    throw new Error(ERROR_MESSAGES.OCR.TEXT_EXTRACTION_FAILED);
  }
};

module.exports = { performOCR };
