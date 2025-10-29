const mongoose = require('mongoose');

const computerGameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  gameMode: {
    type: String,
    enum: ['computer'],
    default: 'computer'
  },
  boardSize: {
    type: Number,
    required: true,
    min: 3,
    max: 6
  },
  aiDifficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  playerSymbol: {
    type: String,
    enum: ['X', 'O'],
    default: 'X'
  },
  aiSymbol: {
    type: String,
    enum: ['X', 'O'],
    default: 'O'
  },
  board: {
    type: [String], // 1D array representing the board state
    required: true
  },
  moves: [{
    index: {
      type: Number,
      required: true
    },
    player: {
      type: String,
      enum: ['X', 'O'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  totalMoves: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['playing', 'completed', 'abandoned'],
    default: 'playing'
  },
  result: {
    type: String,
    enum: ['win', 'loss', 'draw'],
    default: null
  },
  winner: {
    type: String,
    enum: ['X', 'O', 'draw'],
    default: null
  },
  gameDuration: {
    type: Number, // in milliseconds
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
computerGameSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate a unique game ID
computerGameSchema.statics.generateGameId = function() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `comp_${timestamp}_${randomStr}`;
};

// Calculate game duration
computerGameSchema.methods.calculateDuration = function() {
  if (this.completedAt && this.createdAt) {
    this.gameDuration = this.completedAt.getTime() - this.createdAt.getTime();
  }
  return this.gameDuration;
};

// Get game summary for display
computerGameSchema.methods.getGameSummary = function() {
  return {
    gameId: this.gameId,
    boardSize: this.boardSize,
    aiDifficulty: this.aiDifficulty,
    result: this.result,
    totalMoves: this.totalMoves,
    gameDuration: this.gameDuration,
    createdAt: this.createdAt,
    completedAt: this.completedAt
  };
};

module.exports = mongoose.model('ComputerGame', computerGameSchema);
