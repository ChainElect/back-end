/**
 * @module ocrController
 * @description Controller for handling ID document processing, including uploading
 * the front and back images of an ID, extracting and parsing MRZ data, validating
 * the ID document, and storing validated data in the database.
 */
const Sentry = require("@sentry/node");
const fs = require("fs");
const { extractMRZ } = require("../services/ocrService");
const userModel = require("../models/userModel");
const { parseMRZ } = require("../utilities/ocr/mrzExtractor");

const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");
const { SUCCESS_MESSAGES } = require("../utilities/messages/successMessages");

/**
 * Upload the front side of the ID.
 * Currently, we only return the file path since no OCR is performed on the front image.
 */
exports.uploadAndProcessIDFront = async (req, res) => {
  const frontPath = req.file?.path;
  if (!frontPath) {
    return res.status(400).json({
      success: false,
      message: ERROR_MESSAGES.OCR.FRONT_IMAGE_REQUIRED,
    });
  }
  return res.json({
    success: true,
    frontPath,
  });
};

/**
 * Upload and process the back side of the ID.
 * Returns both the file path and the extracted MRZ data.
 */
exports.uploadAndProcessIDBack = async (req, res) => {
  const backPath = req.file?.path;
  if (!backPath) {
    return res.status(400).json({
      success: false,
      message: ERROR_MESSAGES.OCR.BACK_IMAGE_REQUIRED,
    });
  }

  try {
    // Extract MRZ text and parse it
    const mrzText = await extractMRZ(backPath);
    const mrzData = parseMRZ(mrzText);

    return res.json({
      success: true,
      backPath,
      extractedData: mrzData,
    });
  } catch (error) {
    // Asynchronously delete the file if it exists
    try {
      if (fs.existsSync(backPath)) {
        await fs.promises.unlink(backPath);
      }
    } catch (cleanupError) {
      console.error("Error during file cleanup:", cleanupError.message);
    }
    Sentry.captureException(error);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.OCR.BACK_IMAGE_PROCESSING_FAILED,
      error: error.message,
    });
  }
};

/**
 * Final verification endpoint that relies on data extracted from the back (MRZ) image.
 * Expects the backPath in the request body (frontPath is optional and may be used for UI or face matching).
 */
exports.validateIDDocument = async (req, res) => {
  const { backPath } = req.body;
  if (!backPath) {
    return res.status(400).json({
      success: false,
      message: ERROR_MESSAGES.OCR.MISSING_ID_BACK_IMAGE,
    });
  }

  try {
    // Extract and parse MRZ from the back image
    const mrzText = await extractMRZ(backPath);
    const mrzData = parseMRZ(mrzText);

    // Asynchronously clean up the uploaded back image after processing
    try {
      if (fs.existsSync(backPath)) {
        await fs.promises.unlink(backPath);
      }
    } catch (cleanupError) {
      console.error("Error during file cleanup:", cleanupError.message);
    }

    return res.json({
      success: true,
      message: SUCCESS_MESSAGES.OCR.ID_VALIDATION_SUCCESS,
      extractedData: mrzData,
    });
  } catch (error) {
    try {
      if (fs.existsSync(backPath)) {
        await fs.promises.unlink(backPath);
      }
    } catch (cleanupError) {
      console.error("Error during file cleanup:", cleanupError.message);
    }
    Sentry.captureException(error);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.OCR.ID_VALIDATION_FAILED,
      error: error.message,
    });
  }
};

/**
 * Store validated data in the database.
 */
exports.storeValidatedData = async (req, res) => {
  const { name, dob, idNumber } = req.body;

  if (!name || !dob || !idNumber) {
    return res.status(400).json({
      success: false,
      message: ERROR_MESSAGES.OCR.VALIDATED_DATA_REQUIRED,
    });
  }

  try {
    const user = await userModel.saveUser({ name, dob, idNumber });
    return res.json({ success: true, user });
  } catch (error) {
    Sentry.captureException(error);
    return res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.OCR.FAILED_TO_SAVE_USER_DATA,
      error: error.message,
    });
  }
};
