const express = require('express');
const router = express.Router();
const User = require('../models/User');
const ComputerGame = require('../models/ComputerGame');
const { verifyToken } = require('../config/firebase');
const authMiddleware = require('../middleware/auth');

// Get Socket.io instance
let io;
const setSocketIO = (socketIO) => {
  io = socketIO;
};

// Firebase login endpoint - verifies Firebase token and creates/updates user
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID token is required' });
    }

    // Verify Firebase token
    const decodedToken = await verifyToken(idToken);
    
    const userId = decodedToken.uid;
    const email = decodedToken.email;
    const username = decodedToken.name || email.split('@')[0];
    const photoURL = decodedToken.picture || null;

    // Find or create user in database
    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({
        userId,
        username,
        email,
        photoURL
      });
      await user.save();
    } else {
      // Update email, username, and photoURL if they've changed
      user.email = email;
      user.username = username;
      if (photoURL) user.photoURL = photoURL;
      await user.save();
    }

    res.json({
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        photoURL: user.photoURL,
        stats: user.stats,
      }
    });
  } catch (error) {
    console.error('Error in Firebase login:', error);
    res.status(401).json({ error: 'Invalid Firebase token' });
  }
});

// Get current user (requires authentication)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        photoURL: user.photoURL,
        stats: user.stats,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile (requires authentication)
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { username, email, photoURL } = req.body;
    const userId = req.user.userId;

    console.log('==========================================');
    console.log('UPDATE PROFILE REQUEST RECEIVED');
    console.log('UserId:', userId);
    console.log('Request Body:', { username, email, photoURL });
    
    // Check MongoDB connection status
    const mongoose = require('mongoose');
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
    console.log('(0=disconnected, 1=connected, 2=connecting, 3=disconnecting)');
    
    if (mongoose.connection.readyState !== 1) {
      console.error('⚠️ MongoDB is not connected! Cannot update user.');
      return res.status(503).json({ 
        error: 'Database connection not available',
        details: 'MongoDB is not connected. Please ensure MongoDB is running.'
      });
    }
    
    console.log('==========================================');

    if (!username || !email) {
      console.error('Validation failed: Username and email are required');
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Find user first
    let user = await User.findOne({ userId });

    if (!user) {
      console.error('User not found in database:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User found in database - BEFORE UPDATE:');
    console.log('  - Username:', user.username);
    console.log('  - Email:', user.email);
    console.log('  - PhotoURL:', user.photoURL);

    // Prepare update data
    const updateData = {
      username: username,
      email: email,
      photoURL: photoURL !== undefined ? photoURL : user.photoURL,
      updatedAt: new Date()
    };

    console.log('Update data prepared:', updateData);

    // Use findOneAndUpdate for atomic update and to ensure database persistence
    const updatedUser = await User.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      console.error('Failed to update user in database');
      return res.status(500).json({ error: 'Failed to update user in database' });
    }

    console.log('User updated successfully in database - AFTER UPDATE:');
    console.log('  - Username:', updatedUser.username);
    console.log('  - Email:', updatedUser.email);
    console.log('  - PhotoURL:', updatedUser.photoURL);
    console.log('  - UpdatedAt:', updatedUser.updatedAt);

    // Verify the update by querying again
    const verifyUser = await User.findOne({ userId });
    console.log('VERIFICATION - User re-fetched from database:');
    console.log('  - Username:', verifyUser.username);
    console.log('  - Email:', verifyUser.email);
    console.log('  - PhotoURL:', verifyUser.photoURL);
    console.log('==========================================');

    res.json({
      message: 'Profile updated successfully',
      user: {
        userId: updatedUser.userId,
        username: updatedUser.username,
        email: updatedUser.email,
        photoURL: updatedUser.photoURL,
        stats: updatedUser.stats,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      }
    });
  } catch (error) {
    console.error('==========================================');
    console.error('ERROR UPDATING USER PROFILE:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('==========================================');
    res.status(500).json({ 
      error: 'Failed to update profile', 
      details: error.message,
      errorType: error.name 
    });
  }
});

// Delete user account (requires authentication)
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user from Firebase Auth if available
    try {
      const { admin } = require('../config/firebase');
      if (admin && admin.apps.length > 0) {
        await admin.auth().deleteUser(userId);
        console.log('Firebase user deleted successfully');
      }
    } catch (firebaseError) {
      console.error('Error deleting Firebase user:', firebaseError.message);
      // Continue with MongoDB deletion even if Firebase deletion fails
    }

    // Delete user from MongoDB
    await User.deleteOne({ userId });

    res.json({
      message: 'Account deleted successfully',
      deletedUserId: userId
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Get or create user (legacy endpoint)
router.post('/', async (req, res) => {
  try {
    const { userId, username, email } = req.body;

    if (!userId || !username || !email) {
      return res.status(400).json({ error: 'UserId, username, and email are required' });
    }

    let user = await User.findOne({ userId });

    if (!user) {
      user = new User({
        userId,
        username,
        email
      });
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ error: 'Failed to process user' });
  }
});

// Get user stats
router.get('/:userId/stats', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { wins, losses, draws, totalGames } = user.stats;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    res.json({
      wins,
      losses,
      draws,
      winRate,
      totalGames,
      rank: 0 // You can implement a ranking system later
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Get match history
router.get('/:userId/history', async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.matches);
  } catch (error) {
    console.error('Error fetching match history:', error);
    res.status(500).json({ error: 'Failed to fetch match history' });
  }
});

// Test endpoint to verify database operations
router.get('/test-db', authMiddleware, async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const userId = req.user.userId;
    
    console.log('==========================================');
    console.log('DATABASE TEST ENDPOINT');
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
    console.log('User ID:', userId);
    
    // Try to find the user
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.json({
        status: 'error',
        message: 'User not found in database',
        connectionState: mongoose.connection.readyState,
        userId: userId
      });
    }
    
    res.json({
      status: 'success',
      message: 'Database is working correctly',
      connectionState: mongoose.connection.readyState,
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        photoURL: user.photoURL,
        updatedAt: user.updatedAt
      }
    });
    console.log('Database test completed successfully');
    console.log('==========================================');
  } catch (error) {
    console.error('Database test failed:', error);
    console.log('==========================================');
    res.status(500).json({
      status: 'error',
      message: 'Database test failed',
      error: error.message
    });
  }
});

// Get all users (except current user)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    // Find all users except the current user
    const users = await User.find({ userId: { $ne: currentUserId } })
      .select('userId username email photoURL stats')
      .sort({ username: 1 });

    res.json({ users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Send friend request
router.post('/friends/request/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId; // A
    const targetUserId = req.params.userId; // B

    if (currentUserId === targetUserId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }

    // Find both users
    const [currentUser, targetUser] = await Promise.all([
      User.findOne({ userId: currentUserId }),
      User.findOne({ userId: targetUserId })
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already friends
    if (currentUser.friends.includes(targetUserId)) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }

    // Check if request already exists (either direction)
    if (currentUser.sentRequests.includes(targetUserId)) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    if (currentUser.receivedRequests.includes(targetUserId)) {
      return res.status(400).json({ error: 'This user has already sent you a friend request' });
    }

    // Add B's ID to A's sentRequests
    currentUser.sentRequests.push(targetUserId);
    
    // Add A's ID to B's receivedRequests
    targetUser.receivedRequests.push(currentUserId);

    await Promise.all([currentUser.save(), targetUser.save()]);

    // Emit Socket.io event for real-time notification
    if (io) {
      io.emit('friend-request-sent', {
        fromUserId: currentUserId,
        toUserId: targetUserId,
        message: 'Friend request sent'
      });
    }

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept friend request
router.post('/friends/accept/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId; // B (receiver)
    const requesterUserId = req.params.userId; // A (sender)

    // Find both users
    const [currentUser, requesterUser] = await Promise.all([
      User.findOne({ userId: currentUserId }),
      User.findOne({ userId: requesterUserId })
    ]);

    if (!currentUser || !requesterUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request exists
    if (!currentUser.receivedRequests.includes(requesterUserId)) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Remove from sentRequests and receivedRequests
    currentUser.receivedRequests = currentUser.receivedRequests.filter(id => id !== requesterUserId);
    requesterUser.sentRequests = requesterUser.sentRequests.filter(id => id !== currentUserId);

    // Add to friends lists
    if (!currentUser.friends.includes(requesterUserId)) {
      currentUser.friends.push(requesterUserId);
    }
    if (!requesterUser.friends.includes(currentUserId)) {
      requesterUser.friends.push(currentUserId);
    }

    await Promise.all([currentUser.save(), requesterUser.save()]);

    // Emit Socket.io event for real-time notification
    if (io) {
      io.emit('friend-request-accepted', {
        fromUserId: requesterUserId,
        toUserId: currentUserId,
        message: 'Friend request accepted'
      });
    }

    res.json({ message: 'Friend request accepted successfully' });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({ error: 'Failed to accept friend request' });
  }
});

// Reject friend request
router.post('/friends/reject/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId; // B (receiver)
    const requesterUserId = req.params.userId; // A (sender)

    // Find both users
    const [currentUser, requesterUser] = await Promise.all([
      User.findOne({ userId: currentUserId }),
      User.findOne({ userId: requesterUserId })
    ]);

    if (!currentUser || !requesterUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request exists
    if (!currentUser.receivedRequests.includes(requesterUserId)) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Remove from sentRequests and receivedRequests
    currentUser.receivedRequests = currentUser.receivedRequests.filter(id => id !== requesterUserId);
    requesterUser.sentRequests = requesterUser.sentRequests.filter(id => id !== currentUserId);

    await Promise.all([currentUser.save(), requesterUser.save()]);

    // Emit Socket.io event for real-time notification
    if (io) {
      io.emit('friend-request-rejected', {
        fromUserId: requesterUserId,
        toUserId: currentUserId,
        message: 'Friend request rejected'
      });
    }

    res.json({ message: 'Friend request rejected successfully' });
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    res.status(500).json({ error: 'Failed to reject friend request' });
  }
});

// Cancel sent friend request
router.post('/friends/cancel/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId; // A (sender)
    const targetUserId = req.params.userId; // B (receiver)

    // Find both users
    const [currentUser, targetUser] = await Promise.all([
      User.findOne({ userId: currentUserId }),
      User.findOne({ userId: targetUserId })
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if request exists
    if (!currentUser.sentRequests.includes(targetUserId)) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    // Remove from sentRequests and receivedRequests
    currentUser.sentRequests = currentUser.sentRequests.filter(id => id !== targetUserId);
    targetUser.receivedRequests = targetUser.receivedRequests.filter(id => id !== currentUserId);

    await Promise.all([currentUser.save(), targetUser.save()]);

    res.json({ message: 'Friend request cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling friend request:', error);
    res.status(500).json({ error: 'Failed to cancel friend request' });
  }
});

// Unfriend
router.post('/friends/unfriend/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId; // A
    const friendUserId = req.params.userId; // B

    // Find both users
    const [currentUser, friendUser] = await Promise.all([
      User.findOne({ userId: currentUserId }),
      User.findOne({ userId: friendUserId })
    ]);

    if (!currentUser || !friendUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if they are friends
    if (!currentUser.friends.includes(friendUserId)) {
      return res.status(400).json({ error: 'Not friends with this user' });
    }

    // Remove from both friends lists
    currentUser.friends = currentUser.friends.filter(id => id !== friendUserId);
    friendUser.friends = friendUser.friends.filter(id => id !== currentUserId);

    await Promise.all([currentUser.save(), friendUser.save()]);

    res.json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error unfriending:', error);
    res.status(500).json({ error: 'Failed to unfriend' });
  }
});

// Get friends list
router.get('/friends/list', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const user = await User.findOne({ userId: currentUserId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get full user details for each friend
    const friends = await User.find({ userId: { $in: user.friends } })
      .select('userId username email photoURL stats');

    res.json({ friends });
  } catch (error) {
    console.error('Error fetching friends list:', error);
    res.status(500).json({ error: 'Failed to fetch friends list' });
  }
});

// Get received friend requests
router.get('/friends/requests/received', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const user = await User.findOne({ userId: currentUserId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get full user details for each requester
    const requests = await User.find({ userId: { $in: user.receivedRequests } })
      .select('userId username email photoURL stats');

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching received friend requests:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

// Get sent friend requests
router.get('/friends/requests/sent', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const user = await User.findOne({ userId: currentUserId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get full user details for each user we sent request to
    const requests = await User.find({ userId: { $in: user.sentRequests } })
      .select('userId username email photoURL stats');

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching sent friend requests:', error);
    res.status(500).json({ error: 'Failed to fetch sent requests' });
  }
});

// Create new computer game
router.post('/computer-game/create', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { boardSize, aiDifficulty, playerSymbol = 'X' } = req.body;

    // Validate input
    if (!boardSize || !aiDifficulty) {
      return res.status(400).json({ error: 'Board size and AI difficulty are required' });
    }

    if (![3, 4, 5, 6].includes(boardSize)) {
      return res.status(400).json({ error: 'Board size must be 3, 4, 5, or 6' });
    }

    if (!['easy', 'medium', 'hard'].includes(aiDifficulty)) {
      return res.status(400).json({ error: 'AI difficulty must be easy, medium, or hard' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create new computer game
    const gameId = ComputerGame.generateGameId();
    const board = Array(boardSize * boardSize).fill(null);
    
    const computerGame = new ComputerGame({
      gameId,
      userId,
      username: user.username,
      boardSize,
      aiDifficulty,
      playerSymbol,
      aiSymbol: playerSymbol === 'X' ? 'O' : 'X',
      board,
      status: 'playing'
    });

    await computerGame.save();

    res.json({
      message: 'Computer game created successfully',
      gameId,
      game: computerGame.getGameSummary()
    });
  } catch (error) {
    console.error('Error creating computer game:', error);
    res.status(500).json({ error: 'Failed to create computer game' });
  }
});

// Make move in computer game
router.post('/computer-game/move', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { gameId, index, player } = req.body;

    if (!gameId || index === undefined || !player) {
      return res.status(400).json({ error: 'Game ID, index, and player are required' });
    }

    const game = await ComputerGame.findOne({ gameId, userId });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'playing') {
      return res.status(400).json({ error: 'Game is not active' });
    }

    // Validate move
    if (game.board[index] !== null) {
      return res.status(400).json({ error: 'Invalid move - cell is already occupied' });
    }

    // Make the move
    game.board[index] = player;
    game.totalMoves++;
    game.moves.push({
      index,
      player,
      timestamp: new Date()
    });

    await game.save();

    res.json({
      message: 'Move made successfully',
      board: game.board,
      totalMoves: game.totalMoves
    });
  } catch (error) {
    console.error('Error making move:', error);
    res.status(500).json({ error: 'Failed to make move' });
  }
});

// Complete computer game
router.post('/computer-game/complete', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { gameId, result, winner, finalBoard } = req.body;

    if (!gameId || !result) {
      return res.status(400).json({ error: 'Game ID and result are required' });
    }

    if (!['win', 'loss', 'draw'].includes(result)) {
      return res.status(400).json({ error: 'Invalid result. Must be win, loss, or draw' });
    }

    const game = await ComputerGame.findOne({ gameId, userId });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'playing') {
      return res.status(400).json({ error: 'Game is already completed' });
    }

    // Update game with final result
    game.status = 'completed';
    game.result = result;
    game.winner = winner || (result === 'draw' ? 'draw' : null);
    game.completedAt = new Date();
    game.calculateDuration();

    if (finalBoard) {
      game.board = finalBoard;
    }

    await game.save();

    // Update user stats
    const user = await User.findOne({ userId });
    if (user) {
      const updateData = {
        $inc: {
          'stats.totalGames': 1
        },
        $push: {
          matches: {
            gameId: gameId,
            opponent: 'Computer',
            result: result,
            date: game.completedAt,
            moves: game.totalMoves,
            gameMode: 'computer',
            boardSize: game.boardSize,
            aiDifficulty: game.aiDifficulty
          }
        }
      };

      // Increment appropriate stat
      if (result === 'win') {
        updateData.$inc['stats.wins'] = 1;
      } else if (result === 'loss') {
        updateData.$inc['stats.losses'] = 1;
      } else if (result === 'draw') {
        updateData.$inc['stats.draws'] = 1;
      }

      await User.findOneAndUpdate({ userId }, updateData);
    }

    res.json({
      message: 'Game completed successfully',
      game: game.getGameSummary(),
      stats: {
        wins: user.stats.wins + (result === 'win' ? 1 : 0),
        losses: user.stats.losses + (result === 'loss' ? 1 : 0),
        draws: user.stats.draws + (result === 'draw' ? 1 : 0),
        totalGames: user.stats.totalGames + 1
      }
    });
  } catch (error) {
    console.error('Error completing game:', error);
    res.status(500).json({ error: 'Failed to complete game' });
  }
});

// Get computer game history
router.get('/computer-games', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 20, status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const games = await ComputerGame.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('gameId boardSize aiDifficulty result totalMoves gameDuration createdAt completedAt status');

    const totalGames = await ComputerGame.countDocuments(query);

    res.json({
      games: games.map(game => game.getGameSummary()),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalGames / limit),
        totalGames,
        hasNext: page * limit < totalGames,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching computer games:', error);
    res.status(500).json({ error: 'Failed to fetch computer games' });
  }
});

// Get specific computer game details
router.get('/computer-game/:gameId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { gameId } = req.params;

    const game = await ComputerGame.findOne({ gameId, userId });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json({
      game: {
        ...game.getGameSummary(),
        board: game.board,
        moves: game.moves,
        playerSymbol: game.playerSymbol,
        aiSymbol: game.aiSymbol
      }
    });
  } catch (error) {
    console.error('Error fetching game details:', error);
    res.status(500).json({ error: 'Failed to fetch game details' });
  }
});

// Save game result (for computer games) - Legacy endpoint for backward compatibility
router.post('/game/result', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { result, opponent, moves, gameMode } = req.body;

    if (!['win', 'loss', 'draw'].includes(result)) {
      return res.status(400).json({ error: 'Invalid result. Must be win, loss, or draw' });
    }

    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update stats
    const updateData = {
      $inc: {
        'stats.totalGames': 1
      },
      $push: {
        matches: {
          opponent: opponent || 'Computer',
          result: result,
          date: Date.now(),
          moves: moves || 0,
          gameMode: gameMode || 'computer'
        }
      }
    };

    // Increment appropriate stat
    if (result === 'win') {
      updateData.$inc['stats.wins'] = 1;
    } else if (result === 'loss') {
      updateData.$inc['stats.losses'] = 1;
    } else if (result === 'draw') {
      updateData.$inc['stats.draws'] = 1;
    }

    await User.findOneAndUpdate({ userId }, updateData);

    res.json({ 
      message: 'Game result saved successfully',
      stats: {
        wins: user.stats.wins + (result === 'win' ? 1 : 0),
        losses: user.stats.losses + (result === 'loss' ? 1 : 0),
        draws: user.stats.draws + (result === 'draw' ? 1 : 0),
        totalGames: user.stats.totalGames + 1
      }
    });
  } catch (error) {
    console.error('Error saving game result:', error);
    res.status(500).json({ error: 'Failed to save game result' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sortBy = req.query.sortBy || 'wins'; // wins, winRate, totalGames

    let sortCriteria = {};
    if (sortBy === 'wins') {
      sortCriteria = { 'stats.wins': -1 };
    } else if (sortBy === 'winRate') {
      sortCriteria = { 'stats.wins': -1 }; // Will calculate win rate client-side
    } else if (sortBy === 'totalGames') {
      sortCriteria = { 'stats.totalGames': -1 };
    }

    const users = await User.find({ 'stats.totalGames': { $gt: 0 } })
      .select('userId username photoURL stats')
      .sort(sortCriteria)
      .limit(limit);

    // Calculate win rate and add rank
    const leaderboard = users.map((user, index) => {
      const winRate = user.stats.totalGames > 0 
        ? Math.round((user.stats.wins / user.stats.totalGames) * 100) 
        : 0;
      
      return {
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        photoURL: user.photoURL,
        stats: {
          wins: user.stats.wins,
          losses: user.stats.losses,
          draws: user.stats.draws,
          totalGames: user.stats.totalGames,
          winRate: winRate
        }
      };
    });

    // If sorting by win rate, re-sort the array
    if (sortBy === 'winRate') {
      leaderboard.sort((a, b) => {
        if (b.stats.winRate !== a.stats.winRate) {
          return b.stats.winRate - a.stats.winRate;
        }
        return b.stats.wins - a.stats.wins; // Tie-breaker by total wins
      });
      
      // Update ranks after sorting
      leaderboard.forEach((entry, index) => {
        entry.rank = index + 1;
      });
    }

    res.json({
      leaderboard,
      total: leaderboard.length,
      sortBy
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = { router, setSocketIO };


