/**
 * @module IDFieldExtractor
 * @description Provides utilities to extract and validate fields from a text,
 * typically obtained via OCR from an ID.
 */

/**
 * @summary Extracts a specific field from text.
 * @description If a custom regular expression is provided, it uses that to extract
 * the field value; otherwise, it constructs a default regex based on the field name.
 *
 * @param {string} text - The text to search within.
 * @param {string} fieldName - The name of the field to extract.
 * @param {RegExp} [regex=null] - Optional custom regular expression for extraction.
 * @returns {string|null} The extracted field value, or null if not found.
 */
const extractField = (text, fieldName, regex = null) => {
  if (regex) {
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  const regexDefault = new RegExp(
    `\\b${fieldName}\\b\\s*[:\\-]?\\s*([A-Za-z]+)`,
    "i"
  );
  const match = text.match(regexDefault);
  return match ? match[1].trim() : null;
};

/**
 * @summary Extracts identification fields from a text.
 * @description Uses regular expressions to extract common ID fields such as name,
 * father's name, surname, and a 10-digit ID number.
 *
 * @param {string} text - The text containing ID information.
 * @returns {Object} An object containing the extracted fields.
 */
const extractIDFields = (text) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Extracting ID fields from text:", text);
  }
  return {
    // Extract "Name"
    name: extractField(text, "Name", /\bName\s*[:\-]?\s*([A-Za-z]+)\b/i),

    // Extract "Father's Name"
    fathersName: extractField(
      text,
      "Father's name",
      /\bFather's name\s*[:\-]?\s*([A-Za-z]+)\b/i
    ),

    // Extract "Surname"
    surname: extractField(
      text,
      "Surname",
      /\bSurname\s*[:\-]?\s*([A-Za-z]+)\b/i
    ),

    // Extract a 10-digit ID number using either "No" or "Personal No"
    idNumber:
      extractField(text, "No", /\bNo\s*[:\-]?\s*(\d{10})\b/i) ||
      extractField(text, "Personal No", /\bPersonal No\s*[:\-]?\s*(\d{10})\b/i),
  };
};

/**
 * @summary Validates extracted ID data.
 * @description Checks that the required fields (surname, name, father's name, and idNumber)
 * are present in the extracted data.
 *
 * @param {string} frontText - The text containing ID data.
 * @returns {Object} An object with a success flag and either an error message or the extracted data.
 */
const validateIDData = (frontText) => {
  const fields = extractIDFields(frontText);

  if (process.env.NODE_ENV !== "production") {
    console.log("[INFO]: fields:", fields);
  }

  const missingFields = [];
  ["surname", "name", "fathersName", "idNumber"].forEach((field) => {
    if (!fields[field]) {
      missingFields.push(field);
    }
  });

  if (missingFields.length > 0) {
    return {
      success: false,
      message: `Missing required fields: ${missingFields.join(", ")}.`,
    };
  }

  return { success: true, data: fields };
};

module.exports = { extractField, extractIDFields, validateIDData };
