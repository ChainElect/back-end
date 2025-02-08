const parseMRZ = (mrzText) => {
  const mrzLines = mrzText.split("\n");

  if (mrzLines.length !== 3) {
    throw new Error("Invalid MRZ format: Expected exactly 3 lines.");
  }

  const line1 = mrzLines[0] || "";
  const line2 = mrzLines[1] || "";
  const line3 = mrzLines[2] || "";

  // Extract names safely
  const nameParts = line3.split("<<");
  const surname = nameParts[0]?.trim() || "";
  const givenNames = nameParts[1]?.replace(/</g, " ").trim() || "";

  // Handle multiple given names
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
