const express = require("express");
const multer = require("multer");
const {
  captureFaceFromSelfie,
  captureFaceFromIDCard,
  compareFaces,
} = require("../controllers/irController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Route to capture face from selfie
router.post(
  "/capture-face/selfie",
  upload.single("selfie"),
  (req, res, next) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    next();
  },
  captureFaceFromSelfie
);

// Route to capture face from ID card
router.post("/capture-face/id", upload.single("idCard"), captureFaceFromIDCard);

// Route to compare faces
router.post("/compare-faces", compareFaces);

module.exports = router;
