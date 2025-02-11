/**
 * @module SuccessMessages
 * @description Provides a centralized collection of success messages organized by domain.
 * These messages are used throughout the application for consistent success handling.
 */

module.exports = {
  SUCCESS_MESSAGES: {
    /**
     * Authentication-related success messages
     */
    AUTH: {
      USER_REGISTERED: "User registered successfully", // Indicates that a user was registered successfully
      LOGIN: "Login successful", // Indicates a successful login
    },

    /**
     * Common success messages
     * These messages can be used across various modules
     */
    COMMON: {
      SERVER_RUNNING: (PORT) => `server running on port ${PORT}`, // Indicates that the server started successfully
      DATA_RETRIEVED: "Data retrieved successfully", // Indicates that requested data was fetched successfully
      OPERATION_COMPLETED: "Operation completed successfully", // Indicates that a generic operation finished successfully
      PROTECTED_ROUTE_ACCESS: "You have access to this protected route", // Indicates that a user successfully accessed a protected route
    },
    IR: {
      FACE_MATCHED: "Face matched successfully", // Indicates that a face match was successful
    },
    OCR: {
      ID_VALIDATION_SUCCESS: "ID validation successful", // Indicates that ID validation was successful
    },
  },
};
