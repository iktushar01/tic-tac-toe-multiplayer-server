require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const gameRoutes = require('./routes/gameRoutes');
const { router: userRoutes, setSocketIO } = require('./routes/userRoutes');
const { handleSocketConnection } = require('./socket/socketHandler');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Connect to MongoDB
connectDB();

// Initialize Firebase Admin
initializeFirebase();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true
}));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Tic Tac Toe Server is running!' });
});

app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);

// Set Socket.io instance for user routes
setSocketIO(io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  handleSocketConnection(socket, io);
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Socket.io server ready`);
  console.log(`🔗 API available at http://localhost:${PORT}`);
});

module.exports = { app, io };

