const faceapi = require("face-api.js");
const path = require("path");
const { Canvas, Image, ImageData } = require("canvas");
const loadImage = require("../utilities/ir/loadImage");
const cropFace = require("../utilities/ir/cropFace");

// Register the canvas implementation with face-api.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const initializeModels = async () => {
  const modelPath = path.join(__dirname, "../models/face-api");
  const ssdMobilenetv1Path = path.join(modelPath, "ssd_mobilenetv1");
  const faceLandmark68NetPath = path.join(modelPath, "face_landmark_68");
  const faceRecognitionNetPath = path.join(modelPath, "face_recognition");
  const tinyFaceDetectorPath = path.join(modelPath, "tiny_face_detector");

  try {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(ssdMobilenetv1Path); // For selfies
    await faceapi.nets.tinyFaceDetector.loadFromDisk(tinyFaceDetectorPath); // For ID cards
    await faceapi.nets.faceLandmark68Net.loadFromDisk(faceLandmark68NetPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(faceRecognitionNetPath);
    console.log("All models loaded successfully.");
  } catch (error) {
    console.error("Error loading models:", error);
    throw new Error("Failed to initialize face recognition models.");
  }
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

const extractDescriptorFromSelfie = async (imagePath) => {
  try {
    const imgCanvas = await loadImage(imagePath);
    console.log(`Selfie loaded successfully: ${imagePath}`);

    const detection = await faceapi
      .detectSingleFace(
        imgCanvas,
        new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error("No face detected in the selfie.");
    }

    console.log("Selfie detection box:", detection.detection.box);
    return detection.descriptor; // Return the face descriptor
  } catch (error) {
    console.error("Selfie face descriptor extraction failed:", error);
    throw error;
  }
};

const extractDescriptorFromIDCard = async (imagePath) => {
  try {
    const imgCanvas = await loadImage(imagePath);
    console.log(`ID card loaded successfully: ${imagePath}`);

    const detection = await faceapi
      .detectSingleFace(
        imgCanvas,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: 0.2,
        }) // Lower threshold for ID cards
      )
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error("No face detected in the ID card.");
    }

    console.log("ID card detection box:", detection.detection.box);
    return detection.descriptor; // Return the face descriptor
  } catch (error) {
    console.error("ID card face descriptor extraction failed:", error);
    throw error;
  }
};

const compareDescriptors = (descriptor1, descriptor2, threshold = 0.6) => {
  const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
  return distance < threshold; // True if match, false otherwise
};

module.exports = {
  initializeModels,
  detectAndExtractFace,
  extractDescriptorFromSelfie,
  extractDescriptorFromIDCard,
  compareDescriptors,
};
