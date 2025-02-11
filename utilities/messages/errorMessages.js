/**
 * @module ErrorMessages
 * @description Provides a centralized collection of error messages organized by domain.
 * These messages are used throughout the application for consistent error handling.
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
      FRONT_IMAGE_REQUIRED: "Front image is required.", // Thrown when front image is missing
      BACK_IMAGE_REQUIRED: "Back image is required.", // Thrown when back image is missing
      BACK_IMAGE_PROCESSING_FAILED: "Failed to process the back image.", // Thrown when back image processing fails
      MISSING_ID_BACK_IMAGE:
        "Missing ID document back image file path. Upload the back image first.", // Thrown when back image file path is missing
      ID_VALIDATION_FAILED: "ID validation failed.", // Thrown when ID validation fails
      VALIDATED_DATA_REQUIRED: "Name, DOB, and ID number are required.", // Thrown when validated data is missing
      FAILED_TO_SAVE_USER_DATA: "Failed to save user data.", // Thrown when saving user data fails
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
      FACE_IMAGE_REQUIRED: "Face image is required.", // Thrown when a face image is required for a specific operation
      IMAGE_PATHS_REQUIRED:
        "Both selfie and ID card face image paths are required.", // Thrown when both selfie and ID card face image paths are required
      FACE_NOT_MATCHED: "Face does not match the ID photo.", // Thrown when the face does not match the ID photo
      FACE_MATCHING_FAILED: "Face matching failed.", // Thrown when face matching fails
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
