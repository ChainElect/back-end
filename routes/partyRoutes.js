const express = require("express");
const pool = require("../config/db"); // Database connection
const authMiddleware = require("../middlewares/authMiddleware"); // Middleware for authentication
const { ERROR_MESSAGES } = require("../utilities/messages/errorMessages");
const { SUCCESS_MESSAGES } = require("../utilities/messages/successMessages");

const router = express.Router();

// Add a new party (Admin only)
router.post("/add-party", authMiddleware, async (req, res) => {
  const { electionId, partyName } = req.body;

  // Check if the user is an admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: ERROR_MESSAGES.ACCESS_DENIED });
  }

  if (!electionId || !partyName) {
    return res
      .status(400)
      .json({ error: "Election ID and Party Name are required." });
  }

  try {
    const result = await pool.query(
      "INSERT INTO parties (election_id, name) VALUES ($1, $2) RETURNING *",
      [electionId, partyName]
    );

    res.status(201).json({
      message: SUCCESS_MESSAGES.PARTY_ADDED_SUCCESS,
      party: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding party:", error);
    res.status(500).json({ error: ERROR_MESSAGES.DATABASE_ERROR });
  }
});

// Get all parties
router.get("/parties", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM parties");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving parties:", error);
    res.status(500).json({ error: ERROR_MESSAGES.DATABASE_ERROR });
  }
});

// Delete a party (Admin only)
router.delete("/delete-party/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  // Check if the user is an admin
  if (!req.user.isAdmin) {
    return res.status(403).json({ error: ERROR_MESSAGES.ACCESS_DENIED });
  }

  try {
    await pool.query("DELETE FROM parties WHERE id = $1", [id]);
    res.status(200).json({ message: SUCCESS_MESSAGES.PARTY_DELETED_SUCCESS });
  } catch (error) {
    console.error("Error deleting party:", error);
    res.status(500).json({ error: ERROR_MESSAGES.DATABASE_ERROR });
  }
});

module.exports = router;
