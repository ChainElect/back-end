const express = require("express");
const multer = require("multer");
const { compareFaces } = require("../controllers/irController");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Middleware to validate file uploads for `/compare-faces`
const validateUploads = (req, res, next) => {
  if (!req.files || !req.files.selfie || !req.files.idCard) {
    return res.status(400).json({
      message: "Both selfie and ID card images are required.",
    });
  }
  next();
};

// Route to compare faces (single endpoint for selfie and ID card uploads)
router.post(
  "/compare-faces",
  upload.fields([
    { name: "selfie", maxCount: 1 },
    { name: "idCard", maxCount: 1 },
  ]),
  validateUploads,
  compareFaces
);

module.exports = router;
