const canvas = require("canvas");
const faceapi = require("face-api.js");

// Helper: Load image and preprocess
const loadImage = async (imagePath) => {
  try {
    const img = await canvas.loadImage(imagePath);
    return faceapi.createCanvasFromMedia(img);
  } catch (error) {
    console.error(`Failed to load image: ${imagePath}`, error);
    throw new Error("Image preprocessing failed.");
  }
};

module.exports = loadImage;
