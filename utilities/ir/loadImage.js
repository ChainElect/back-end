const fs = require("fs");
const { loadImage } = require("canvas");

// Helper: Load image and preprocess
const loadImageUtility = async (imagePath) => {
  try {
    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found at path: ${imagePath}`);
    }

    // Load the image using the canvas package
    return await loadImage(imagePath);
  } catch (error) {
    console.error("Failed to load image:", error);
    throw new Error("Image preprocessing failed.");
  }
};
module.exports = loadImageUtility;
