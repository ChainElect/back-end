const express = require("express");
const registrationController = require("../controllers/registrationController");
const router = express.Router();

// Complete registration route
router.post("/complete", registrationController.completeRegistration);

module.exports = router;