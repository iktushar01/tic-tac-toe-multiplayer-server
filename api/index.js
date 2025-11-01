// Vercel serverless function handler
try {
  require('dotenv').config();
} catch (e) {
  // dotenv might not be needed in production
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Initialize Express app first
const app = express();

// Basic middleware - these should always work
// CORS configuration - allow both localhost (development) and production URLs
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    // Always allow localhost for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For development/testing, allow all origins - restrict in production
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root route - should always work
app.get('/', (req, res) => {
  res.json({ 
    message: 'Tic Tac Toe Server is running on Vercel!',
    timestamp: new Date().toISOString(),
    status: 'ok'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState;
    const mongoStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    res.json({ 
      status: 'ok',
      timestamp: new Date().toISOString(),
      mongo: mongoStates[mongoStatus] || 'unknown',
      mongoState: mongoStatus
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      error: error.message 
    });
  }
});

// Try to load routes - if they fail, app still works for basic endpoints
let gameRoutes, userRoutes;
try {
  const connectDB = require('../server/config/database');
  const { initializeFirebase } = require('../server/config/firebase');
  gameRoutes = require('../server/routes/gameRoutes');
  const userRoutesModule = require('../server/routes/userRoutes');
  userRoutes = userRoutesModule.router;

  // Connect to MongoDB (only if not already connected)
  if (mongoose.connection.readyState === 0) {
    connectDB().catch(err => {
      console.error('MongoDB connection error:', err.message);
    });
  }

  // Initialize Firebase Admin
  try {
    initializeFirebase();
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
  }

  // Set up API routes
  app.use('/api/games', gameRoutes);
  app.use('/api/users', userRoutes);
} catch (error) {
  console.error('Error loading routes:', error.message);
  // Add error route
  app.use('/api/*', (req, res) => {
    res.status(500).json({ 
      error: 'Routes not loaded',
      message: error.message 
    });
  });
}

// Export handler for Vercel
// Export the Express app directly - Vercel will handle routing
module.exports = app;

