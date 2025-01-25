const faceapi = require("face-api.js");
const path = require("path");
const loadImage = require("../utilities/image/loadImage");
const cropFace = require("../utilities/image/cropFace");

const initializeModels = async () => {
  const modelPath = path.join(__dirname, "../models");
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
};

const detectAndExtractFace = async (imagePath) => {
  try {
    const imgCanvas = await loadImage(imagePath);
    const detection = await faceapi
      .detectSingleFace(imgCanvas)
      .withFaceLandmarks();

    if (!detection) {
      throw new Error("No face detected in the image.");
    }

    const faceRegion = detection.detection.box;
    const croppedFacePath = `${imagePath}-cropped.jpg`;

    await cropFace(imgCanvas, faceRegion, croppedFacePath);
    return croppedFacePath;
  } catch (error) {
    console.error("Face detection and extraction failed:", error);
    throw error;
  }
};

module.exports = {
  initializeModels,
  detectAndExtractFace,
};
