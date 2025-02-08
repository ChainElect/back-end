require('dotenv').config();
const { API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

// contracts/admin.js
const { ethers } = require('ethers');
const { wallet } = require('../config/provider');

const adminContractAddress = CONTRACT_ADDRESS; // Replace with deployed Admin contract address

const contractData = require("../artifacts/contracts/VotingSystem.sol/VotingSystem.json");
const adminAbi = contractData.abi;
const adminContract = new ethers.Contract(adminContractAddress, adminAbi, wallet);


async function getAdmin() {
    return await adminContract.admin();
}

// Change the admin address
async function changeAdmin(newAdminAddress) {
    const tx = await adminContract.changeAdmin(newAdminAddress);
    await tx.wait();
    return `Admin changed to: ${newAdminAddress}`;
}

module.exports = {
    getAdmin,
    changeAdmin
};

// Testing the methods
/*
async function main() {
    try {
        const result = await getAdmin();
        console.log(result);
    } catch (error) {
        console.error("Error fetching admin:", error);
    }
    try {
        const key = "0xd65dffEB5c554Dc2d540b657e95565cC5594AA11";
        const result = await changeAdmin(key);
        
        console.log(result);
    } catch (error){
        console.log("Error changing the admin!")
    }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in script execution:", error);
    process.exit(1);
  });
*/