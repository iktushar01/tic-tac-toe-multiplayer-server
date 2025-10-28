const express = require('express');
const router = express.Router();
const User = require('../models/User');
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
    const currentUserId = req.user.userId;
    const targetUserId = req.params.userId;

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
    if (currentUser.friends.includes(targetUser._id)) {
      return res.status(400).json({ error: 'Already friends with this user' });
    }

    // Check if friend request already exists
    const existingRequest = targetUser.friendRequests.find(
      req => req.from.toString() === currentUser._id.toString() && req.status === 'pending'
    );

    if (existingRequest) {
      return res.status(400).json({ error: 'Friend request already sent' });
    }

    // Add friend request to target user
    targetUser.friendRequests.push({
      from: currentUser._id,
      status: 'pending'
    });

    await targetUser.save();

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

// Respond to friend request (accept/reject)
router.post('/friends/respond/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const requesterUserId = req.params.userId;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "accept" or "reject"' });
    }

    // Find both users
    const [currentUser, requesterUser] = await Promise.all([
      User.findOne({ userId: currentUserId }),
      User.findOne({ userId: requesterUserId })
    ]);

    if (!currentUser || !requesterUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the friend request
    const friendRequest = currentUser.friendRequests.find(
      req => req.from.toString() === requesterUser._id.toString() && req.status === 'pending'
    );

    if (!friendRequest) {
      return res.status(404).json({ error: 'Friend request not found' });
    }

    if (action === 'accept') {
      // Add to friends list for both users
      if (!currentUser.friends.includes(requesterUser._id)) {
        currentUser.friends.push(requesterUser._id);
      }
      if (!requesterUser.friends.includes(currentUser._id)) {
        requesterUser.friends.push(currentUser._id);
      }

      // Update friend request status
      friendRequest.status = 'accepted';
    } else {
      // Update friend request status to rejected
      friendRequest.status = 'rejected';
    }

    await Promise.all([currentUser.save(), requesterUser.save()]);

    // Emit Socket.io event for real-time notification
    if (io) {
      io.emit('friend-request-responded', {
        fromUserId: requesterUserId,
        toUserId: currentUserId,
        action,
        message: `Friend request ${action}ed`
      });
    }

    res.json({ 
      message: `Friend request ${action}ed successfully`,
      action 
    });
  } catch (error) {
    console.error('Error responding to friend request:', error);
    res.status(500).json({ error: 'Failed to respond to friend request' });
  }
});

// Get friends list
router.get('/friends/list', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const user = await User.findOne({ userId: currentUserId })
      .populate('friends', 'userId username email photoURL stats');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ friends: user.friends });
  } catch (error) {
    console.error('Error fetching friends list:', error);
    res.status(500).json({ error: 'Failed to fetch friends list' });
  }
});

// Get incoming friend requests
router.get('/friends/requests', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    
    const user = await User.findOne({ userId: currentUserId })
      .populate({
        path: 'friendRequests.from',
        select: 'userId username email photoURL',
        match: { status: 'pending' }
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Filter out requests that don't have a valid 'from' user (in case of deleted users)
    const pendingRequests = user.friendRequests.filter(req => 
      req.status === 'pending' && req.from
    );

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    res.status(500).json({ error: 'Failed to fetch friend requests' });
  }
});

module.exports = { router, setSocketIO };

