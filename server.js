const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { SUCCESS_MESSAGES } = require("./utilities/successMessages");
const authRoutes = require("./routes/authRoutes"); // Import authRoutes

dotenv.config();
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
    methods: process.env.ALLOWED_METHODS
      ? process.env.ALLOWED_METHODS.split(",")
      : ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: process.env.ALLOWED_HEADERS
      ? process.env.ALLOWED_HEADERS.split(",")
      : ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(SUCCESS_MESSAGES.SERVER_RUNNING_SUCCESSFULLY(PORT));
});

app.use(authRoutes);
