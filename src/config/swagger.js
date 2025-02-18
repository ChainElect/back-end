const path = require("path");
const swaggerAutogen = require("swagger-autogen")();

const doc = {
  info: {
    title: "ChainElect API",
    description: "API documentation for ChainElect backend",
  },
  host: "localhost:3000",
  schemes: ["http"],
};

const outputFile = path.join(__dirname, "../../src/docs/openapi.yaml");
const endpointsFiles = [
  path.join(__dirname, "../../server.js"),
  path.join(__dirname, "../../src/routes/authRoutes.js"),
  path.join(__dirname, "../../src/routes/partyRoutes.js"),
  path.join(__dirname, "../../src/routes/ocrRoutes.js"),
  path.join(__dirname, "../../src/routes/irRoutes.js"),
  path.join(__dirname, "../../src/routes/ocrRoutes.js"),
];

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log("OpenAPI file generated!");
});
