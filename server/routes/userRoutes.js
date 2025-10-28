const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { verifyToken } = require('../config/firebase');
const authMiddleware = require('../middleware/auth');

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
    const { username, email } = req.body;
    const userId = req.user.userId;

    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user data
    user.username = username;
    user.email = email;
    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        photoURL: user.photoURL,
        stats: user.stats,
        updatedAt: user.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
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

module.exports = router;

