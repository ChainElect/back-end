const fs = require("fs");
const { performOCR, extractMRZ } = require("../services/ocrService");
const faceRecognitionService = require("../services/faceRecognitionService");
const userModel = require("../models/userModel");
const { validateIDData } = require("../utilities/ocr/fieldExtractor");
const { parseMRZ } = require("../utilities/ocr/mrzExtractor");

// Upload ID Document (both sides)
exports.uploadIDDocument = (req, res) => {
  const frontPath = req.files?.front[0]?.path; // Front side path
  const backPath = req.files?.back[0]?.path; // Back side path

  if (!frontPath || !backPath) {
    return res.status(400).json({
      message: "Both front and back images are required.",
    });
  }

  res.json({
    success: true,
    filePaths: { front: frontPath, back: backPath },
  });
};

// Validate ID Document using previously uploaded files
exports.validateIDDocument = async (req, res) => {
  const { frontPath, backPath } = req.body; // Paths stored from `/upload-id`

  if (!frontPath || !backPath) {
    return res.status(400).json({
      success: false,
      message: "Missing ID document file paths. Upload ID first.",
    });
  }

  try {
    // Extract details from the front side
    const frontText = await performOCR(frontPath);
    const frontData = validateIDData(frontText);

    if (!frontData.success) {
      return res
        .status(400)
        .json({ success: false, message: frontData.message });
    }

    // Extract and parse MRZ from the back side
    const mrzText = await extractMRZ(backPath);
    const mrzData = parseMRZ(mrzText);

    console.log("Front Data:", frontData.data);
    console.log("MRZ Data:", mrzData);

    // Compare MRZ with Front OCR
    const isMatch =
      frontData.data.name.toUpperCase() === mrzData.name.toUpperCase() &&
      frontData.data.surname.toUpperCase() === mrzData.surname.toUpperCase() &&
      frontData.data.fathersName.toUpperCase() ===
        mrzData.fathersName.toUpperCase();

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          "ID verification failed. Data mismatch between front OCR and MRZ.",
      });
    }

    // Cleanup files
    fs.unlinkSync(frontPath);
    fs.unlinkSync(backPath);

    res.json({
      success: true,
      message: "ID validation successful",
      extractedData: {
        ...frontData.data,
        mrzData,
      },
    });
  } catch (error) {
    if (fs.existsSync(frontPath)) fs.unlinkSync(frontPath);
    if (fs.existsSync(backPath)) fs.unlinkSync(backPath);

    res.status(500).json({
      success: false,
      message: "ID validation failed.",
      error: error.message,
    });
  }
};

// Upload Face Image
exports.uploadFaceImage = (req, res) => {
  const filePath = req.file.path;
  if (!filePath) {
    return res.status(400).json({
      success: false,
      message: "Face image is required.",
    });
  }
  res.json({ success: true, filePath });
};

// Match Face
exports.matchFace = async (req, res) => {
  const { idPhotoPath, faceImagePath } = req.body;

  if (!idPhotoPath || !faceImagePath) {
    return res.status(400).json({
      success: false,
      message: "Both ID photo and face image paths are required.",
    });
  }

  try {
    const isMatch = await faceRecognitionService.compareFaces(
      idPhotoPath,
      faceImagePath
    );
    if (isMatch) {
      res.json({ success: true, message: "Face matched successfully" });
    } else {
      res.status(400).json({
        success: false,
        message: "Face does not match the ID photo.",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Face matching failed.",
      error: error.message,
    });
  }
};

// Store Validated Data
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
