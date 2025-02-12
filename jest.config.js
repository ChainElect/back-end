module.exports = {
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "routes/partyRoutes.js",
    "services/",
    "extractDescriptor.js",
    "initializeModels.js",
    "authRoutes.js",
  ],
  moduleNameMapper: {
    "^@middlewares/(.*)$": "<rootDir>/src/middlewares/$1",
    "^@controllers/(.*)$": "<rootDir>/src/controllers/$1",
    "^@config/(.*)$": "<rootDir>/src/config/$1",
    "^@models/(.*)$": "<rootDir>/src/models/$1",
    "^@routes/(.*)$": "<rootDir>/src/routes/$1",
    "^@services/(.*)$": "<rootDir>/src/services/$1",
    "^@utilities/(.*)$": "<rootDir>/src/utilities/$1",
  },
};
