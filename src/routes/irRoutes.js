const express = require("express");
const multer = require("multer");
const irController = require("../controllers/irController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Route to upload a face image (for either a selfie or ID card face)
router.post(
  "/upload/face",
  upload.single("faceImage"),
  irController.uploadFaceImage
);

// Route to match a face image with an ID photo using file paths.
// The request body should be JSON with keys:
//   - "selfieFacePath": the file path from the selfie upload
//   - "idCardFacePath": the file path from the ID card face upload
router.post("/match/face", irController.matchFace);

module.exports = router;
