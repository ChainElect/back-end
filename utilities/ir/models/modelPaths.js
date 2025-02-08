const path = require("path");

/**
 * Base directory for face recognition models.
 * This is the root folder where all the models are stored.
 */
const MODEL_BASE_PATH = path.join(__dirname, "../../../models/face-api");

/**
 * Object containing paths to all required models for face recognition.
 * These paths point to specific subdirectories under the base model directory.
 */
const MODEL_PATHS = {
  /**
   * Base path for all models.
   * Example: "/path/to/project/models/face-api"
   */
  base: MODEL_BASE_PATH,

  /**
   * Path for the SSD MobileNet V1 model.
   * Used for detecting faces in selfies or other images.
   * Example: "/path/to/project/models/face-api/ssd_mobilenetv1"
   */
  ssdMobilenetv1: path.join(MODEL_BASE_PATH, "ssd_mobilenetv1"),

  /**
   * Path for the Face Landmark 68 model.
   * Used for detecting facial landmarks like eyes, nose, and mouth.
   * Example: "/path/to/project/models/face-api/face_landmark_68"
   */
  faceLandmark68: path.join(MODEL_BASE_PATH, "face_landmark_68"),

  /**
   * Path for the Face Recognition model.
   * Used for extracting and comparing face descriptors.
   * Example: "/path/to/project/models/face-api/face_recognition"
   */
  faceRecognition: path.join(MODEL_BASE_PATH, "face_recognition"),

  /**
   * Path for the Tiny Face Detector model.
   * Optimized for low-resolution or small images like ID cards.
   * Example: "/path/to/project/models/face-api/tiny_face_detector"
   */
  tinyFaceDetector: path.join(MODEL_BASE_PATH, "tiny_face_detector"),
};

module.exports = MODEL_PATHS;
