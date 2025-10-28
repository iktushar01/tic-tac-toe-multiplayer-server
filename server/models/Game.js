const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  player1: {
    socketId: String,
    userId: String,
    username: String
  },
  player2: {
    socketId: String,
    userId: String,
    username: String
  },
  currentPlayer: {
    type: String,
    default: 'X'
  },
  board: {
    type: [[String]],
    default: [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ]
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'abandoned'],
    default: 'waiting'
  },
  winner: {
    type: String,
    default: null
  },
  isDraw: {
    type: Boolean,
    default: false
  },
  moves: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Update the updatedAt field before saving
gameSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate a random 4-digit room code
gameSchema.statics.generateRoomCode = function() {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

module.exports = mongoose.model('Game', gameSchema);

