const fs = require("fs");
const path = require("path");

// Path to your generated OpenAPI file (adjust if necessary)
const outputFile = path.join(__dirname, "../../src/docs/openapi.yaml");

fs.readFile(outputFile, "utf8", (err, data) => {
  if (err) {
    console.error("Error reading file:", err);
    return;
  }

  // Remove the line containing swagger: "2.0"
  // This regex assumes the line starts with "swagger:" and contains "2.0"
  const updatedData = data.replace(/^swagger:\s*["']?2\.0["']?\s*\n?/m, "");

  fs.writeFile(outputFile, updatedData, "utf8", (err) => {
    if (err) {
      console.error("Error writing file:", err);
      return;
    }
    console.log('Successfully removed "swagger: 2.0" from the OpenAPI file.');
  });
});
