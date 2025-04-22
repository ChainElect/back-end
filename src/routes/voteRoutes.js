const express = require("express");
const voteController = require("../controllers/voteController");
const router = express.Router();

// Prepare vote route
router.post("/prepare", voteController.prepareVote);

// Cast vote route
router.post("/cast", voteController.castVote);

module.exports = router;