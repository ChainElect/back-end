# 🗳️ ChainElect Backend

## 🚀 Overview

**ChainElect** is a blockchain-based electronic voting system designed to ensure secure, transparent, and tamper-proof elections. This repository contains the backend services that power the ChainElect platform, handling user authentication, voting processes, and integration with blockchain smart contracts.

---

## 🛠️ Features

- 🔐 **User Authentication**: Secure login and registration system.
- 🗳️ **Voting Management**: Handle voting operations with blockchain integration.
- 📜 **Smart Contract Interaction**: Interfaces with Ethereum smart contracts for vote recording and verification.
- 📦 **Dockerized Deployment**: Containerized application for consistent and scalable deployments.

---

## 🏗️ Tech Stack

- **Backend**: Node.js, Express.js
- **Blockchain**: Ethereum, Solidity
- **Database**: [Specify your database, e.g., MongoDB, PostgreSQL]
- **Containerization**: Docker

---

## 🔧 Setup & Installation

```bash
### 1️⃣ Clone the Repository
git clone https://github.com/ChainElect/back-end.git
cd back-end
```
### 2️⃣ Install Dependencies
```
npm install
```
### 3️⃣ Configure Environment Variables
Create a .env file in the root directory and add the following variables:
```
echo "PORT=5000" >> .env
echo "DATABASE_URL=your_database_connection_string" >> .env
echo "JWT_SECRET=your_jwt_secret" >> .env
echo "BLOCKCHAIN_NODE_URL=your_blockchain_node_url" >> .env
```
Replace your_database_connection_string, your_jwt_secret, and your_blockchain_node_url with actual values.

---
## 🚀 Running the Application
```bash
# Start in Development Mode
npm run dev

# Start in Production Mode
npm start
```
Ensure that all environment variables are properly configured before starting the application in production mode.

---
## 🧪 Running Tests
```bash
# Run Tests
npm test

# Run Coverage Reports
npm run test:coverage
```
---
## 🐳 Docker Deployment
```bash
# 1️⃣ Build the Docker Image
docker build -t chainelect-backend .

# 2️⃣ Run the Docker Container
docker run -p 5000:5000 --env-file .env chainelect-backend
```
Ensure that your .env file is correctly configured and accessible to the Docker container.

---

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

---
