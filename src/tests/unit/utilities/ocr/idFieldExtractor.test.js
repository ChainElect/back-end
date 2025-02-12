// tests/unit/idFieldExtractor.test.js
const {
  extractField,
  extractIDFields,
  validateIDData,
} = require("@utilities/ocr/fieldExtractor");

describe("ID Field Extractor Utilities", () => {
  describe("extractField", () => {
    it("should extract field using custom regex", () => {
      const text = "Name: John";
      const value = extractField(text, "Name", /Name\s*:\s*(\w+)/i);
      expect(value).toBe("John");
    });

    it("should extract field using default regex", () => {
      const text = "Surname - Smith";
      const value = extractField(text, "Surname");
      // Default regex matches: \bSurname\b\s*[:\-]?\s*([A-Za-z]+)
      expect(value).toBe("Smith");
    });

    it("should return null if field is not found", () => {
      const text = "No relevant field";
      const value = extractField(text, "NonExistent");
      expect(value).toBeNull();
    });
  });

  describe("extractIDFields", () => {
    it("should extract all ID fields from text", () => {
      const text =
        "Name: John\nFather's name: Michael\nSurname: Doe\nNo: 1234567890";
      const fields = extractIDFields(text);
      expect(fields.name).toBe("John");
      expect(fields.fathersName).toBe("Michael");
      expect(fields.surname).toBe("Doe");
      expect(fields.idNumber).toBe("1234567890");
    });
  });

  describe("validateIDData", () => {
    it("should return an error if any required field is missing", () => {
      const text = "Name: John\nSurname: Doe"; // Missing father's name and idNumber
      const result = validateIDData(text);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Missing required fields/);
    });

    it("should return success with data if all fields are present", () => {
      const text =
        "Name: John\nFather's name: Michael\nSurname: Doe\nNo: 1234567890";
      const result = validateIDData(text);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        name: "John",
        fathersName: "Michael",
        surname: "Doe",
        idNumber: "1234567890",
      });
    });
  });
});
