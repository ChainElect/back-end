// server.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Register Endpoint
app.post("/register", async (req, res) => {
  const { fullName, email, password, idNumber } = req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into the database
    const result = await pool.query(
      "INSERT INTO users (full_name, email, password_hash, id_number) VALUES ($1, $2, $3, $4) RETURNING id",
      [fullName, email, hashedPassword, idNumber]
    );

    res
      .status(201)
      .json({
        message: "User registered successfully",
        userId: result.rows[0].id,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
});

// Login Endpoint
app.post("/login", async (req, res) => {
  const { idNumber, password } = req.body;

  try {
    // Find user by ID number
    const userResult = await pool.query(
      "SELECT * FROM users WHERE id_number = $1",
      [idNumber]
    );
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Compare provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});
const authMiddleware = require("./authMiddleware");

app.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You have access to this protected route",
    userId: req.user.userId,
  });
});
