// tests/integration/irController.integration.test.js
const request = require("supertest");
const express = require("express");
const irController = require("@controllers/irController");

const app = express();
app.use(express.json());

// Mount endpoints
app.post("/api/ir/upload-face", irController.uploadFaceImage);
app.post("/api/ir/match-face", irController.matchFace);

// ---
// For the matchFace endpoint, we need to mock its dependencies:
const { initializeModels } = require("@utilities/ir/models/initializeModels");
const {
  extractDescriptorFromSelfie,
  extractDescriptorFromIDCard,
} = require("@services/irService");
const { compareDescriptors } = require("@utilities/ir/compareDescriptors");

jest.mock("@utilities/ir/models/initializeModels");
jest.mock("@services/irService");
jest.mock("@utilities/ir/compareDescriptors");

describe("IR Controller Endpoints", () => {
  describe("POST /api/ir/upload-face", () => {
    it("should return 400 if no file is provided", async () => {
      const res = await request(app).post("/api/ir/upload-face").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should return success with file path when file is provided", async () => {
      // Create a temporary app that attaches req.file to simulate a file upload
      const testApp = express();
      testApp.use(express.json());
      testApp.post(
        "/test-upload",
        (req, res, next) => {
          req.file = { path: "uploads/test.jpg" };
          next();
        },
        irController.uploadFaceImage
      );

      const res = await request(testApp).post("/test-upload").send({});
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ success: true, filePath: "uploads/test.jpg" });
    });
  });

  describe("POST /api/ir/match-face", () => {
    const validSelfiePath = "uploads/selfie.jpg";
    const validIDCardPath = "uploads/idcard.jpg";
    const dummyDescriptor = new Float32Array([0.1, 0.2, 0.3]);

    beforeEach(() => {
      initializeModels.mockResolvedValue();
      extractDescriptorFromSelfie.mockResolvedValue(dummyDescriptor);
      extractDescriptorFromIDCard.mockResolvedValue(dummyDescriptor);
    });

    it("should return 400 if image paths are missing", async () => {
      const res = await request(app).post("/api/ir/match-face").send({});
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should return success when descriptors match", async () => {
      compareDescriptors.mockReturnValue(true);
      const res = await request(app).post("/api/ir/match-face").send({
        selfieFacePath: validSelfiePath,
        idCardFacePath: validIDCardPath,
      });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("message");
    });

    it("should return 400 when descriptors do not match", async () => {
      compareDescriptors.mockReturnValue(false);
      const res = await request(app).post("/api/ir/match-face").send({
        selfieFacePath: validSelfiePath,
        idCardFacePath: validIDCardPath,
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
    });

    it("should return 500 on internal error", async () => {
      initializeModels.mockRejectedValue(new Error("Init error"));
      const res = await request(app).post("/api/ir/match-face").send({
        selfieFacePath: validSelfiePath,
        idCardFacePath: validIDCardPath,
      });
      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body).toHaveProperty("message");
      expect(res.body).toHaveProperty("error");
    });
  });
});
