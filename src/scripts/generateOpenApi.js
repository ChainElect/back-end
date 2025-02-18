const fs = require("fs");
const path = require("path");
const { swaggerSpec } = require("../config/swagger");

// Ensure the docs directory exists
const docsPath = path.join(__dirname, "../docs");
if (!fs.existsSync(docsPath)) {
  fs.mkdirSync(docsPath, { recursive: true });
}

// Generate OpenAPI file
const filePath = path.join(docsPath, "openapi.yaml");
fs.writeFileSync(filePath, JSON.stringify(swaggerSpec, null, 2));

console.log(`✅ OpenAPI spec generated successfully at ${filePath}`);
