const express = require("express");
const Sentry = require("@sentry/node");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const { SUCCESS_MESSAGES } = require("./utilities/messages/successMessages");
const authRoutes = require("./routes/authRoutes");
const partyRoutes = require("./routes/partyRoutes");
const ocrRoutes = require("./routes/ocrRoutes");
const irRoutes = require("./routes/irRoutes");

dotenv.config();

const app = express();

// Initialize Sentry as early as possible
Sentry.init({
  dsn: process.env.SENTRY_DSN, // Ensure this is set in your .env file
  environment: process.env.NODE_ENV || "development",
  tracesSampleRate: 0.2, // Adjust the sample rate as needed
});

// The Sentry request handler should be the first middleware
app.use(Sentry.Handlers.requestHandler());

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
app.use(authRoutes);
app.use(partyRoutes);
app.use(ocrRoutes);
app.use(irRoutes);

// Catch-all route for the React SPA (must come after static middleware and API routes)
app.get("*", (req, res) => {
  res.sendFile(path.join(reactBuildPath, "index.html"));
});

// The Sentry error handler should be registered after your routes
app.use(Sentry.Handlers.errorHandler());

// Fallback error handler (if needed)
app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(SUCCESS_MESSAGES.COMMON.SERVER_RUNNING(PORT));
});
