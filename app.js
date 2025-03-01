require("./instrument");

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./src/routes/authRoutes");
const partyRoutes = require("./src/routes/partyRoutes");
const ocrRoutes = require("./src/routes/ocrRoutes");
const irRoutes = require("./src/routes/irRoutes");

dotenv.config();

const app = express();

// Configure CORS
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    methods: process.env.ALLOWED_METHODS
      ? process.env.ALLOWED_METHODS.split(",")
      : ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: process.env.ALLOWED_HEADERS
      ? process.env.ALLOWED_HEADERS.split(",")
      : ["Content-Type", "Authorization", "Baggage", "Sentry-Trace"],
  })
);

// Parse JSON bodies
app.use(express.json());

// Serve static files from the React build folder
const reactBuildPath = path.join(__dirname, "build");
app.use(express.static(reactBuildPath));

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/party", partyRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/ir", irRoutes);

// Catch-all route for the React SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(reactBuildPath, "index.html"));
});

// Fallback error handler
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

module.exports = app; // Export the app for use in `server.js` and tests
