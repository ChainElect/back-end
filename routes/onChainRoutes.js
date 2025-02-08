// routes/onChainRoutes.js
const express = require('express');
const { getAdmin, changeAdmin } = require('../chainInteractions/AdminFunc');
const { createElection, addParty, getResults } = require('../chainInteractions/ElectionFunc');
const { vote } = require('../chainInteractions/VoteFunc');

const router = express.Router();

// Route for getting the admin address
router.get('/admin', async (req, res) => {
    try {
        const admin = await getAdmin();
        res.send(`Current admin: ${admin}`);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route to change the admin
router.post('/admin/change', async (req, res) => {
    const { newAdminAddress } = req.body;
    try {
        const result = await changeAdmin(newAdminAddress);
        res.send(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route to create a new election
router.post('/election', async (req, res) => {
    const { name, startTime, endTime } = req.body;
    try {
        const result = await createElection(name, startTime, endTime);
        res.send(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route to add a party to an election
router.post('/election/:id/party', async (req, res) => {
    const { id } = req.params;
    const { partyName } = req.body;
    try {
        const result = await addParty(id, partyName);
        res.send(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route to get election results
router.get('/election/:id/results', async (req, res) => {
    const { id } = req.params;
    try {
        const results = await getResults(id);
        res.json(results);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

// Route to cast a vote
router.post('/vote', async (req, res) => {
    const { electionId, partyId } = req.body;
    try {
        const result = await vote(electionId, partyId);
        res.send(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;