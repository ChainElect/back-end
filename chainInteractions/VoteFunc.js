require('dotenv').config();
const { API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

// contracts/admin.js
const { ethers } = require('ethers');
const { wallet } = require('../config/provider');

const adminContractAddress = CONTRACT_ADDRESS; // Replace with deployed Admin contract address

const contractData = require("../artifacts/contracts/VotingSystem.sol/VotingSystem.json");
const adminAbi = contractData.abi;
const adminContract = new ethers.Contract(adminContractAddress, adminAbi, wallet);

// Cast a vote for a party in an election
async function vote(electionId, partyId) {
    const tx = await adminContract.vote(electionId, partyId);
    await tx.wait();
    return `Voted for party ID: ${partyId} in election ID: ${electionId}`;
}

module.exports = {
    vote
};

/*
async function main(){
    try {
        const electionId = ""; // Enter electionId
        const partyId = ""; // Enter partyId

        const result = await vote(electionId,partyId);
        console.log(result);
    } catch(error){
        console.log(error)
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in script execution:", error);
    process.exit(1);
  });
*/