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
const extractIDFields = (text) => {
  return {
    // Match "Name" distinctly
    name: extractField(text, "Name", /\bName\s*[:\-]?\s*([A-Za-z]+)\b/i),

    // Match "Father's Name"
    fathersName: extractField(
      text,
      "Father's name",
      /\bFather's name\s*[:\-]?\s*([A-Za-z]+)\b/i
    ),

    // Match "Surname" with strict context
    surname: extractField(
      text,
      "Surname",
      /\bSurname\s*[:\-]?\s*([A-Za-z]+)\b/i
    ),

    // Match "No" or "Personal No" for the 10-digit ID number
    idNumber:
      extractField(text, "No", /\bNo\s*[:\-]?\s*(\d{10})\b/i) ||
      extractField(text, "Personal No", /\bPersonal No\s*[:\-]?\s*(\d{10})\b/i),
  };
};

const validateIDData = (frontText) => {
  const fields = extractIDFields(frontText);

  // Check for missing required fields
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
