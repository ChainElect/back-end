require("./instrument");

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./src/routes/authRoutes");
const partyRoutes = require("./src/routes/partyRoutes");
const ocrRoutes = require("./src/routes/ocrRoutes");
const irRoutes = require("./src/routes/irRoutes");
const registrationRoutes = require("./src/routes/registrationRoutes");
const voteRoutes = require("./src/routes/voteRoutes");
const zkpVotingRoutes = require("./src/routes/zkpVotingRoutes");

dotenv.config();

const app = express();

// Trust first proxy (NGINX)
app.set("trust proxy", 1);

// Configure CORS with proper options
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://chainelect.org' // Production domain
    : ['http://localhost:3000', 'http://localhost'], // Development frontend URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'sentry-trace', // Add the Sentry trace header
    'baggage' // Sentry may also use this header
  ],
  credentials: true
};

// Apply CORS middleware with options
app.use(cors(corsOptions));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

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
app.use("/api/registration", registrationRoutes);
app.use("/api/vote", voteRoutes);
app.use("/api/zkp", zkpVotingRoutes);

// Catch-all route for the React SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(reactBuildPath, "index.html"));
});

// Fallback error handler
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

module.exports = app; // Export the app for use in `server.js` and tests