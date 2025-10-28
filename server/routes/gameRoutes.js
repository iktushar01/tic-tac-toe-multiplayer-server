const express = require('express');
const router = express.Router();
const Game = require('../models/Game');

// Create a new game
router.post('/create', async (req, res) => {
  try {
    const { userId, username } = req.body;
    
    if (!userId || !username) {
      return res.status(400).json({ error: 'UserId and username are required' });
    }

    const roomCode = Game.generateRoomCode();
    
    const game = new Game({
      roomCode,
      player1: {
        userId,
        username
      },
      status: 'waiting'
    });

    await game.save();

    res.status(201).json({
      gameId: game._id,
      roomCode: game.roomCode,
      status: game.status
    });
  } catch (error) {
    console.error('Error creating game:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Join a game
router.post('/join', async (req, res) => {
  try {
    const { roomCode, userId, username } = req.body;

    if (!roomCode || !userId || !username) {
      return res.status(400).json({ error: 'Room code, userId, and username are required' });
    }

    const game = await Game.findOne({ roomCode });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'Game is not available to join' });
    }

    if (game.player1.userId === userId) {
      return res.status(400).json({ error: 'You are already in this game' });
    }

    game.player2 = {
      userId,
      username
    };
    game.status = 'active';
    game.currentPlayer = 'X';

    await game.save();

    res.json({
      gameId: game._id,
      roomCode: game.roomCode,
      status: game.status,
      board: game.board,
      currentPlayer: game.currentPlayer
    });
  } catch (error) {
    console.error('Error joining game:', error);
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Get game status
router.get('/:gameId', async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// Get game by room code
router.get('/room/:roomCode', async (req, res) => {
  try {
    const game = await Game.findOne({ roomCode: req.params.roomCode });

    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

module.exports = router;

