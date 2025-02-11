// routes/verificationRoutes.js

const express = require("express");
const multer = require("multer");
const {
  uploadAndProcessIDFront,
  uploadAndProcessIDBack,
  validateIDDocument,
  storeValidatedData,
} = require("../controllers/ocrController");
const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Combined endpoints for front and back upload and processing
router.post(
  "/upload/id/front",
  upload.single("frontImage"),
  uploadAndProcessIDFront
);

router.post(
  "/upload/id/back",
  upload.single("backImage"),
  uploadAndProcessIDBack
);

// Final verification endpoint remains if you need an extra check
router.post("/verify/id", validateIDDocument);

// Other endpoints (face upload/matching and saving user data)
router.post("/save-user-data", storeValidatedData);

module.exports = router;
