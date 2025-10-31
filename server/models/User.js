const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  photoURL: {
    type: String,
    default: null
  },
  coins: {
    type: Number,
    default: 5000 // Initial coin balance
  },
  coinStats: {
    totalBet: {
      type: Number,
      default: 0
    },
    totalWinnings: {
      type: Number,
      default: 0
    },
    totalLosses: {
      type: Number,
      default: 0
    },
    highestWin: {
      type: Number,
      default: 0
    },
    gamesPlayed: {
      type: Number,
      default: 0
    },
    dailyClaimsStreak: {
      type: Number,
      default: 0
    },
    totalDailyClaims: {
      type: Number,
      default: 0
    }
  },
  lastDailyClaimDate: {
    type: Date,
    default: null
  },
  stats: {
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    draws: {
      type: Number,
      default: 0
    },
    totalGames: {
      type: Number,
      default: 0
    }
  },
  matches: [{
    gameId: String,
    opponent: String,
    result: {
      type: String,
      enum: ['win', 'loss', 'draw']
    },
    date: Date,
    moves: Number
  }],
  friends: [{
    type: String,
    ref: 'User'
  }],
  sentRequests: [{
    type: String,
    ref: 'User'
  }],
  receivedRequests: [{
    type: String,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);

