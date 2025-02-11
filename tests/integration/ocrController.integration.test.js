// tests/integration/ocrController.integration.test.js
const request = require("supertest");
const express = require("express");
const multer = require("multer");
const ocrController = require("../../controllers/ocrController");
const fs = require("fs");
const { extractMRZ } = require("../../services/ocrService");
const { parseMRZ } = require("../../utilities/ocr/mrzExtractor");
const userModel = require("../../models/userModel");

jest.mock("../../services/ocrService");
jest.mock("../../utilities/ocr/mrzExtractor");
jest.mock("../../models/userModel");

// Stub out file cleanup so it doesn’t cause errors in tests.
jest.spyOn(fs, "existsSync").mockReturnValue(true);
jest.spyOn(fs.promises, "unlink").mockResolvedValue();

const app = express();
app.use(express.json());
const upload = multer({ dest: "uploads/" });

// Mount OCR endpoints
app.post(
  "/api/ocr/upload-front",
  upload.single("file"),
  ocrController.uploadAndProcessIDFront
);
app.post(
  "/api/ocr/upload-back",
  upload.single("file"),
  ocrController.uploadAndProcessIDBack
);
app.post("/api/ocr/validate", ocrController.validateIDDocument);
app.post("/api/ocr/store", ocrController.storeValidatedData);

describe("OCR Controller Endpoints", () => {
  describe("POST /api/ocr/upload-front", () => {
    it("should return 400 if no file is provided", async () => {
      const res = await request(app).post("/api/ocr/upload-front").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should return success with frontPath when file is provided", async () => {
      // Use a test route that manually attaches req.file
      const testApp = express();
      testApp.use(express.json());
      testApp.post(
        "/test-upload-front",
        (req, res, next) => {
          req.file = { path: "uploads/front.jpg" };
          next();
        },
        ocrController.uploadAndProcessIDFront
      );

      const res = await request(testApp).post("/test-upload-front").send({});
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        frontPath: "uploads/front.jpg",
      });
    });
  });

  describe("POST /api/ocr/upload-back", () => {
    it("should return 400 if no file is provided", async () => {
      const res = await request(app).post("/api/ocr/upload-back").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should return success with backPath and extractedData when file is provided", async () => {
      const fakeMRZText = "IDABC123456789\nSomeData\nLine3";
      const fakeParsedData = { documentType: "ID", issuingCountry: "ABC" };
      extractMRZ.mockResolvedValue(fakeMRZText);
      parseMRZ.mockReturnValue(fakeParsedData);

      const testApp = express();
      testApp.use(express.json());
      testApp.post(
        "/test-upload-back",
        (req, res, next) => {
          req.file = { path: "uploads/back.jpg" };
          next();
        },
        ocrController.uploadAndProcessIDBack
      );

      const res = await request(testApp).post("/test-upload-back").send({});
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        backPath: "uploads/back.jpg",
        extractedData: fakeParsedData,
      });
    });

    it("should return 500 and attempt file cleanup on error during processing", async () => {
      extractMRZ.mockRejectedValue(new Error("OCR failed"));
      const testApp = express();
      testApp.use(express.json());
      testApp.post(
        "/test-upload-back-error",
        (req, res, next) => {
          req.file = { path: "uploads/back-error.jpg" };
          next();
        },
        ocrController.uploadAndProcessIDBack
      );

      const res = await request(testApp)
        .post("/test-upload-back-error")
        .send({});
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/ocr/validate", () => {
    it("should return 400 if backPath is missing in request body", async () => {
      const res = await request(app).post("/api/ocr/validate").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should return success with extractedData when valid backPath is provided", async () => {
      const fakeMRZText = "IDXYZ123456789\nDataLine\nLine3";
      const fakeParsedData = { documentType: "ID", issuingCountry: "XYZ" };
      extractMRZ.mockResolvedValue(fakeMRZText);
      parseMRZ.mockReturnValue(fakeParsedData);

      const res = await request(app)
        .post("/api/ocr/validate")
        .send({ backPath: "uploads/validate.jpg" });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: expect.any(String),
        extractedData: fakeParsedData,
      });
    });

    it("should return 500 and attempt file cleanup on error during validation", async () => {
      extractMRZ.mockRejectedValue(new Error("Validation OCR failed"));
      const res = await request(app)
        .post("/api/ocr/validate")
        .send({ backPath: "uploads/invalid.jpg" });
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("error");
    });
  });

  describe("POST /api/ocr/store", () => {
    it("should return 400 if required validated data is missing", async () => {
      const res = await request(app)
        .post("/api/ocr/store")
        .send({ name: "John" });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should return success with user data when valid data is provided", async () => {
      const fakeUser = {
        id: 1,
        name: "John",
        dob: "1990-01-01",
        idNumber: "1234567890",
      };
      userModel.saveUser.mockResolvedValue(fakeUser);
      const res = await request(app)
        .post("/api/ocr/store")
        .send({ name: "John", dob: "1990-01-01", idNumber: "1234567890" });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ success: true, user: fakeUser });
    });

    it("should return 500 if saving user data fails", async () => {
      userModel.saveUser.mockRejectedValue(new Error("DB error"));
      const res = await request(app)
        .post("/api/ocr/store")
        .send({ name: "John", dob: "1990-01-01", idNumber: "1234567890" });
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("error");
    });
  });
});
