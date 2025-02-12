// tests/unit/mrzExtractor.test.js
const { parseMRZ } = require("@utilities/ocr/mrzExtractor");

describe("parseMRZ", () => {
  it("should parse valid MRZ text correctly", () => {
    // Create a valid MRZ with exactly 3 lines
    const mrzText =
      "IDABC123456789\n123456789012345678\nSMITH<<JOHN<<<<<<<<<<<<";
    const result = parseMRZ(mrzText);
    expect(result).toHaveProperty("documentType");
    expect(result).toHaveProperty("issuingCountry");
    expect(result).toHaveProperty("documentNumber");
    expect(result).toHaveProperty("nationality");
    expect(result).toHaveProperty("dob");
    expect(result).toHaveProperty("gender");
    expect(result).toHaveProperty("expiryDate");
    expect(result).toHaveProperty("surname");
    expect(result).toHaveProperty("name");
    expect(result).toHaveProperty("fathersName");
    // Check a couple of parsed values
    expect(result.documentType).toBe("ID");
    expect(result.issuingCountry).toBe("ABC");
  });

  it("should throw error if MRZ text does not have exactly 3 lines", () => {
    const invalidMRZ = "IDABC123456789\nSMITH<<JOHN<<<<<<<<<<<<";
    expect(() => parseMRZ(invalidMRZ)).toThrow(
      "Invalid MRZ format: Expected exactly 3 lines."
    );
  });
});
