const express = require("express");
const multer = require("multer");
const {
  captureFaceFromSelfie,
  captureFaceFromIDCard,
} = require("../controllers/irController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Route to capture face from selfie
router.post(
  "/capture-face/selfie",
  upload.single("selfie"),
  captureFaceFromSelfie
);

// Route to capture face from ID card
router.post("/capture-face/id", upload.single("idCard"), captureFaceFromIDCard);

module.exports = router;
