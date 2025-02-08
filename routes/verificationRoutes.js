// routes/verificationRoutes.js

const express = require("express");
const multer = require("multer");
const {
  uploadIDDocument,
  validateIDDocument,
  uploadFaceImage,
  matchFace,
  storeValidatedData,
} = require("../controllers/verificationController");

const router = express.Router();

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

// Route to handle ID document upload
router.post(
  "/upload-id",
  upload.fields([
    { name: "front", maxCount: 1 }, // Front side of ID
    { name: "back", maxCount: 1 }, // Back side of ID
  ]),
  uploadIDDocument // Controller to handle both sides
);
// Route to validate the uploaded ID document (OCR and validation)
router.post("/validate-id", validateIDDocument);

// Route to handle live face image upload
router.post("/upload-face", upload.single("faceImage"), uploadFaceImage);

// Route to match the live face image with the ID photo
router.post("/match-face", matchFace);

// Route to store the validated user data in the database
router.post("/save-user-data", storeValidatedData);

module.exports = router;
