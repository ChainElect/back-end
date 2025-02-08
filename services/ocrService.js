const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const fs = require("fs");

// Preprocess image for better OCR accuracy
const preprocessImage = async (filePath) => {
  const processedPath = `${filePath}-processed.png`;
  await sharp(filePath)
    .grayscale() // Convert to grayscale
    .normalise() // Enhance contrast
    .resize(1000) // Resize for better clarity
    .toFile(processedPath);
  return processedPath;
};

// Perform OCR on the preprocessed image
const performOCR = async (filePath) => {
  try {
    const processedPath = await preprocessImage(filePath);
    const tessdataPath = "/app/tessdata";

    const {
      data: { text },
    } = await Tesseract.recognize(processedPath, "eng", {
      langPath: tessdataPath,
    });

    fs.unlinkSync(processedPath); // Clean up processed file
    return text;
  } catch (error) {
    console.error("OCR Error:", error);
    throw new Error("OCR failed. Ensure the ID image is clear and readable.");
  }
};

module.exports = { performOCR };
