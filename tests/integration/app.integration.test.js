// tests/integration/app.integration.test.js

const request = require("supertest");
const express = require("express");
const path = require("path");

// Create a new Express application for testing
const app = express();
app.use(express.json());

// Import your route modules (adjust the paths as needed)
const irRoutes = require("../../routes/irRoutes");
const ocrRoutes = require("../../routes/ocrRoutes");
const authRoutes = require("../../routes/authRoutes");
const partyRoutes = require("../../routes/partyRoutes");

// Mount the routes under appropriate prefixes.
// (Ensure these routes export an Express.Router instance.)
app.use("/api/ir", irRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/party", partyRoutes);

// Optionally, if your app also serves a frontend (e.g. a React SPA),
// serve the static build folder.
const reactBuildPath = path.join(__dirname, "../../build");
app.use(express.static(reactBuildPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(reactBuildPath, "index.html"));
});

describe("Application Integration Tests", () => {
  // Basic health check (or root route)
  test("GET / should return index.html (or similar)", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    // Optionally, check for HTML content in the response header.
    expect(res.header["content-type"]).toMatch(/html/);
  });

  // Test an IR endpoint.
  // For example, if the IR controller's uploadFaceImage is mounted on POST /api/ir/upload-face:
  test("POST /api/ir/upload/face should return 400 when no file is provided", async () => {
    const res = await request(app).post("/api/ir/upload/face").send({}); // No file data provided.
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  // Test an OCR endpoint.
  // For example, if the OCR controller's uploadAndProcessIDFront is mounted on POST /api/ocr/upload-front:
  test("POST /api/ocr/upload/id/front should return 400 when no file is provided", async () => {
    const res = await request(app).post("/api/ocr/upload/id/front").send({}); // No file data provided.
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  // You can add additional tests to simulate valid requests, error conditions,
  // or even to check that middleware (like authentication) works as expected.
});
