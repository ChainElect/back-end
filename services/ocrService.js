const Tesseract = require("tesseract.js");
const fs = require("fs");
const { preprocessImage } = require("../utilities/ocr/preprocessImage");
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");

const TESSDATA_PATH = process.env.TESSDATA_PATH || "/app/tessdata";

/**
 * @summary Performs OCR on an image file.
 * @description Preprocesses the image, performs OCR using Tesseract.js, and extracts the text.
 *
 * @param {string} filePath - The path to the image file.
 * @returns {Promise<string>} The extracted text from the image.
 * @throws {Error} Throws an error if OCR fails or the image cannot be processed.
 */
const performOCR = async (filePath) => {
  let processedPath;
  try {
    processedPath = await preprocessImage(filePath);
    const {
      data: { text },
    } = await Tesseract.recognize(processedPath, "eng", {
      langPath: TESSDATA_PATH,
    });
    return text;
  } catch (error) {
    console.error(`[OCR_ERROR]: ${error.message}`, {
      filePath,
      stack: error.stack,
    });
    throw new Error(ERROR_MESSAGES.OCR.TEXT_EXTRACTION_FAILED);
  } finally {
    if (processedPath) {
      try {
        await fs.promises.unlink(processedPath);
      } catch (cleanupError) {
        console.error(`[FILE_CLEANUP_ERROR]: ${cleanupError.message}`, {
          processedPath,
        });
      }
    }
  }
};

/**
 * @summary Extracts MRZ text from an ID card image.
 * @description Preprocesses the image, performs OCR using Tesseract.js with the "ocrb" language, and formats the MRZ text.
 *
 * @param {string} filePath - The path to the image file.
 * @returns {Promise<string>} The formatted MRZ text.
 * @throws {Error} Throws an error if MRZ extraction fails.
 */
const extractMRZ = async (filePath) => {
  let processedPath;
  try {
    processedPath = await preprocessImage(filePath);
    const {
      data: { text },
    } = await Tesseract.recognize(processedPath, "ocrb", {
      langPath: TESSDATA_PATH,
    });
    const lines = text
      .split("\n")
      .map((line) => line.replace(/\s/g, ""))
      .filter((line) => /^[A-Z0-9<]+$/.test(line) && line.length > 20);
    const mrzStartIndex = lines.findIndex((line) =>
      /^ID[A-Z]{3}[0-9<]+$/.test(line)
    );
    if (mrzStartIndex === -1 || lines.length - mrzStartIndex < 3) {
      throw new Error(
        "Invalid MRZ format: ID pattern not found or incomplete MRZ."
      );
    }
    const mrzLines = lines.slice(mrzStartIndex, mrzStartIndex + 3);
    return mrzLines.join("\n");
  } catch (error) {
    console.error(`[MRZ_ERROR]: ${error.message}`, {
      filePath,
      stack: error.stack,
    });
    throw new Error(ERROR_MESSAGES.OCR.TEXT_EXTRACTION_FAILED);
  } finally {
    if (processedPath) {
      try {
        await fs.promises.unlink(processedPath);
      } catch (cleanupError) {
        console.error(`[FILE_CLEANUP_ERROR]: ${cleanupError.message}`, {
          processedPath,
        });
      }
    }
  }
};

module.exports = { performOCR, extractMRZ };
