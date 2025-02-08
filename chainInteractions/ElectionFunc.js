require('dotenv').config();
const { API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

// contracts/admin.js
const { ethers } = require('ethers');
const { wallet } = require('../config/provider');

const adminContractAddress = CONTRACT_ADDRESS; // Replace with deployed Admin contract address

const contractData = require("../artifacts/contracts/VotingSystem.sol/VotingSystem.json");
const adminAbi = contractData.abi;
const adminContract = new ethers.Contract(adminContractAddress, adminAbi, wallet);

// Create a new election
async function createElection(name, startTime, endTime) {
    const tx = await adminContract.createElection(name, startTime, endTime);
    await tx.wait();
    return `Election created: ${name}`;
}

// Add a party to an election
async function addParty(electionId, partyName) {
    const tx = await adminContract.addParty(electionId, partyName);
    await tx.wait();
    return `Party added: ${partyName} to election ID: ${electionId}`;
}

// Get election results
async function getResults(electionId) {
    const results = await adminContract.getResults(electionId);
    return results;
}

module.exports = {
    createElection,
    addParty,
    getResults
};

/*
Testing the methods
async function main() {
    // Create new election
    try {
        const name = "Election Demo";
        const startTime = ""; // Enter start time as a time stamp!
        const endTime = "";   // Enter start time as a time stamp!

        const result = await createElection(name, startTime, endTime);
        console.log(result);
    } catch (error) {
        console.log(error);
    }

    // Add party to the election
    try {
       const electionId = ""; // Enter start time as a time stamp!
       const party1 = "Party1";

       const result = await addParty(electionId, party1);
       console.log(result)
    } catch (error){
        console.log(error);
    }

    // Add party to the election
    try {
        const electionId = ""; // Enter start time as a time stamp!
        const party2 = "Party2";
 
        const result = await addParty(electionId, party2);
        console.log(result)
     } catch (error){
         console.log(error);
     }

    //Get results
    try {
        const electionId = ""; // Enter electionId 
        let results = await getResults(electionId);
        
        console.log("The results are:", results)
    } catch (error){
        console.log(error);
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in script execution:", error);
    process.exit(1);
  });
*/