const fs = require("fs");
const { extractMRZ } = require("../services/ocrService");
const userModel = require("../models/userModel");
const { parseMRZ } = require("../utilities/ocr/mrzExtractor");

/**
 * Upload the front side of the ID.
 * Now, we only return the file path since we don't perform OCR on the front image.
 */
exports.uploadAndProcessIDFront = async (req, res) => {
  const frontPath = req.file?.path;
  if (!frontPath) {
    return res.status(400).json({
      success: false,
      message: "Front image is required.",
    });
  }
  res.json({
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
      message: "Back image is required.",
    });
  }

  try {
    // Extract MRZ text and parse it
    const mrzText = await extractMRZ(backPath);
    const mrzData = parseMRZ(mrzText);

    res.json({
      success: true,
      backPath,
      extractedData: mrzData,
    });
  } catch (error) {
    if (fs.existsSync(backPath)) fs.unlinkSync(backPath);
    res.status(500).json({
      success: false,
      message: "Failed to process the back image.",
      error: error.message,
    });
  }
};

/**
 * Final verification endpoint that now relies solely on data extracted from the back (MRZ) image.
 * Expects the backPath in the request body (frontPath is optional and may be used for UI or face matching).
 */
exports.validateIDDocument = async (req, res) => {
  const { backPath } = req.body;
  if (!backPath) {
    return res.status(400).json({
      success: false,
      message:
        "Missing ID document back image file path. Upload the back image first.",
    });
  }

  try {
    // Extract and parse MRZ from the back image
    const mrzText = await extractMRZ(backPath);
    const mrzData = parseMRZ(mrzText);

    // Optionally clean up the uploaded back image after processing
    if (fs.existsSync(backPath)) fs.unlinkSync(backPath);

    res.json({
      success: true,
      message: "ID validation successful",
      extractedData: mrzData,
    });
  } catch (error) {
    if (fs.existsSync(backPath)) fs.unlinkSync(backPath);
    res.status(500).json({
      success: false,
      message: "ID validation failed.",
      error: error.message,
    });
  }
};

/**
 * Store Validated Data in the database.
 */
exports.storeValidatedData = async (req, res) => {
  const { name, dob, idNumber } = req.body;

  if (!name || !dob || !idNumber) {
    return res.status(400).json({
      success: false,
      message: "Name, DOB, and ID number are required.",
    });
  }

  try {
    const user = await userModel.saveUser({ name, dob, idNumber });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to save user data.",
      error: error.message,
    });
  }
};
