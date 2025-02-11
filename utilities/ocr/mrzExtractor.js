/**
 * @module MRZParser
 * @description Provides functionality to parse the Machine Readable Zone (MRZ)
 * from an ID document and extract relevant fields.
 */

/**
 * @summary Parses MRZ text and extracts fields.
 * @description Splits the provided MRZ text into three lines, then extracts fields
 * such as document type, issuing country, document number, nationality, date of birth,
 * gender, expiry date, surname, given name, and father's name. If the text does not
 * conform to the expected 3-line format, an error is thrown.
 *
 * @param {string} mrzText - The raw MRZ text from the document.
 * @returns {Object} An object containing the parsed MRZ fields.
 * @throws {Error} Throws an error if the MRZ text does not contain exactly 3 lines.
 */
const parseMRZ = (mrzText) => {
  // Trim and split the text into lines (supports both Unix and Windows line endings)
  const mrzLines = mrzText.trim().split(/\r?\n/);

  if (mrzLines.length !== 3) {
    throw new Error("Invalid MRZ format: Expected exactly 3 lines.");
  }

  // Extract individual MRZ lines
  const line1 = mrzLines[0] || "";
  const line2 = mrzLines[1] || "";
  const line3 = mrzLines[2] || "";

  // Extract surname and given names from the third line using the separator '<<'
  const nameParts = line3.split("<<");
  const surname = nameParts[0]?.trim() || "";
  const givenNames = nameParts[1]?.replace(/</g, " ").trim() || "";

  // Split given names to handle multiple names: first is the primary name, the rest form the father's name
  const nameArray = givenNames ? givenNames.split(" ") : [];
  const name = nameArray[0] || "";
  const fathersName = nameArray.slice(1).join(" ") || "";

  return {
    documentType: line1.substring(0, 2) || "UNKNOWN",
    issuingCountry: line1.substring(2, 5) || "UNKNOWN",
    documentNumber: line1.substring(5, 14) || "UNKNOWN",
    nationality: line2.substring(15, 18) || "UNKNOWN",
    dob: line2.substring(0, 6) || "000000",
    gender: line2.substring(7, 8) || "<",
    expiryDate: line2.substring(8, 14) || "000000",
    name: name || "UNKNOWN",
    fathersName: fathersName || "UNKNOWN",
    surname: surname || "UNKNOWN",
  };
};

module.exports = { parseMRZ };
