const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes'); // Import the authentication routes
const onChainRoutes = require('./routes/onChainRoutes'); // Import the smart contract related routes

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
    methods: process.env.ALLOWED_METHODS
      ? process.env.ALLOWED_METHODS.split(',')
      : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: process.env.ALLOWED_HEADERS
      ? process.env.ALLOWED_HEADERS.split(',')
      : ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

// Use the authentication routes
app.use(authRoutes);

// Use the smart contract related routes
app.use(onChainRoutes); // Prefix the smart contract routes with `/on-chain`

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});