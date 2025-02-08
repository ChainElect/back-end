/**
 * Centralized Success Messages
 *
 * This module provides a consistent way to define and manage success messages
 * across the application. Grouped by feature modules, it allows easier
 * localization, modification, and reuse.
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
  },
};
