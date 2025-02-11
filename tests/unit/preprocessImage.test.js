const fs = require("fs");
const path = require("path");
const { preprocessImage } = require("../../utilities/ocr/preprocessImage");

describe("Preprocess Image", () => {
  it("should throw error for missing image file", async () => {
    // Test should simulate missing file
    const invalidPath = undefined; // You could also use a non-existent file path here
    await expect(preprocessImage(invalidPath)).rejects.toThrow(
      "Image processing failed"
    );
  });
});
