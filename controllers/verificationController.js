const fs = require("fs");
const { performOCR } = require("../services/ocrService");
const faceRecognitionService = require("../services/faceRecognitionService");
const userModel = require("../models/userModel");
const { validateIDData } = require("../utilities/ocr/fieldExtractor");

// Upload ID Document (both sides)
exports.uploadIDDocument = (req, res) => {
  const frontPath = req.files?.front[0]?.path; // Front side path
  const backPath = req.files?.back[0]?.path; // Back side path
  console.log("Front Path:", frontPath);
  console.log("Back Path:", backPath);
  if (!frontPath || !backPath) {
    return res.status(400).json({
      success: false,
      message: "Both front and back images are required.",
    });
  }

  res.json({
    success: true,
    filePaths: { front: frontPath, back: backPath },
  });
};

// Validate ID Document (both sides)
exports.validateIDDocument = async (req, res) => {
  const { frontPath } = req.body; // Only use the frontPath

  if (!frontPath) {
    return res.status(400).json({
      success: false,
      message: "Front file path is required.",
    });
  }

  try {
    const frontText = await performOCR(frontPath);

    console.log("Extracted Front Text:", frontText);

    fs.unlinkSync(frontPath); // Clean up the file after processing

    const validationResult = validateIDData(frontText);

    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: validationResult.message,
      });
    }

    res.json({
      success: true,
      message: "ID validation successful",
      extractedData: validationResult.data,
    });
  } catch (error) {
    if (fs.existsSync(frontPath)) fs.unlinkSync(frontPath);

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
