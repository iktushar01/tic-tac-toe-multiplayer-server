// Vercel serverless function handler
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const connectDB = require('../server/config/database');
const { initializeFirebase } = require('../server/config/firebase');
const gameRoutes = require('../server/routes/gameRoutes');
const { router: userRoutes } = require('../server/routes/userRoutes');

// Initialize Express app
const app = express();

// Connect to MongoDB (only if not already connected)
// Note: In serverless, connections are cached between invocations
if (mongoose.connection.readyState === 0) {
  connectDB().catch(err => {
    console.error('MongoDB connection error:', err.message);
  });
}

// Initialize Firebase Admin (idempotent)
try {
  initializeFirebase();
} catch (error) {
  console.error('Firebase already initialized or error:', error.message);
}

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "*",
  credentials: true
}));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Tic Tac Toe Server is running on Vercel!' });
});

app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Export the app for Vercel
module.exports = app;

