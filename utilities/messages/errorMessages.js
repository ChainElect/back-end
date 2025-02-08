/**
 * Centralized Error Messages
 *
 * This module provides a consistent way to define and manage error messages
 * across the application. Grouped by feature modules, it allows easier
 * localization, modification, and reuse.
 */
module.exports = {
  ERROR_MESSAGES: {
    /**
     * Authentication-related error messages
     */
    AUTH: {
      USER_NOT_FOUND: "User not found", // Thrown when a requested user does not exist
      INVALID_CREDENTIALS: "Invalid credentials", // Thrown when login credentials are invalid
      INVALID_TOKEN: "Invalid token", // Thrown when an authentication token is invalid
      ACCESS_DENIED: "Access denied", // Thrown when the user lacks necessary permissions
      USER_REGISTERED_SUCCESS: "User registered successfully", // Indicates successful user registration
    },

    /**
     * OCR-related error messages
     */
    OCR: {
      TEXT_EXTRACTION_FAILED:
        "OCR failed. Ensure the ID image is clear and readable.", // Thrown when OCR processing fails
      IMAGE_PROCESSING_FAILED: "Image processing failed", // Thrown during preprocessing issues
    },

    /**
     * Image Recognition (IR)-related error messages
     */
    IR: {
      MODEL_INITIALIZATION_FAILED:
        "Failed to initialize face recognition models.", // Thrown when face recognition models fail to load
      IMAGE_NOT_FOUND: (PATH) => `Image not found at path: ${PATH}`, // Thrown when the provided image path is invalid
      IMAGE_PREPROCESSING_FAILED: "Image preprocessing failed", // Thrown when the image cannot be processed for face detection
      FACE_CROPPING_FAILED:
        "Face cropping failed. Unable to process the image.", // Thrown during face cropping issues
      NO_FACE_DETECTED: "No face detected in the image", // Thrown when no face is detected in the image
      FACE_EXTRACTION_FAILED: "Face extraction failed", // Thrown when face extraction fails
      FACE_COMPARISON_FAILED: "Face comparison failed", // Thrown when face comparison fails
    },

    /**
     * Common error messages
     * These messages are shared across various modules
     */
    COMMON: {
      DATABASE_ERROR: "Database error", // Thrown for database connectivity or query issues
      SERVER_ERROR: "Server error", // Thrown for generic server-side issues
    },
  },
};
