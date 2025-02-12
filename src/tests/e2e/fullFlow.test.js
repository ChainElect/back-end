// tests/e2e/fullFlow.test.js
const request = require("supertest");
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// Import your routes (adjust paths as needed)
const irRoutes = require("@routes/irRoutes");
const ocrRoutes = require("@routes/ocrRoutes");
const authRoutes = require("@routes/authRoutes");
const partyRoutes = require("@routes/partyRoutes");

// Mount the routes
app.use("/api/ir", irRoutes);
app.use("/api/ocr", ocrRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/party", partyRoutes);

// Optionally, serve your frontend static files if needed.
const reactBuildPath = path.join(__dirname, "../../build");
app.use(express.static(reactBuildPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(reactBuildPath, "index.html"));
});

describe("Full Flow End-to-End Test", () => {
  it("should load the homepage (index.html)", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.header["content-type"]).toMatch(/html/);
  });

  // You can add more tests here that simulate a user registering, logging in,
  // uploading images, etc., to exercise the entire flow.
});
