const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const { SUCCESS_MESSAGES } = require("./utilities/messages/successMessages");
const authRoutes = require("./routes/authRoutes");
const partyRoutes = require("./routes/partyRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const irRoutes = require("./routes/irRoutes");
dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    methods: process.env.ALLOWED_METHODS
      ? process.env.ALLOWED_METHODS.split(" ,")
      : ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: process.env.ALLOWED_HEADERS
      ? process.env.ALLOWED_HEADERS.split(",")
      : ["Content-Type", "Authorization", "Baggage", "Sentry-Trace"],
  })
);

app.use(express.json());

const reactBuildPath = path.join(__dirname, "build");
app.use(express.static(reactBuildPath));

// Use the authentication routes
app.use(authRoutes);

// Use the party routes
app.use(partyRoutes);

// Use the verification routes
app.use(verificationRoutes);

// Use the IR routes
app.use(irRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(reactBuildPath, "index.html"));
});
// Use the smart contract related routes
app.use(onChainRoutes); // Prefix the smart contract routes with `/on-chain`

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(SUCCESS_MESSAGES.COMMON.SERVER_RUNNING(PORT));
});
