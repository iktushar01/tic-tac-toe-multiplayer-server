const Game = require('../models/Game');
const User = require('../models/User');

// Store active connections
const activeConnections = new Map(); // socketId -> { roomCode, userId }

const handleSocketConnection = (socket, io) => {
  
  // Handle join room
  socket.on('join-room', async ({ roomCode, userId, username }) => {
    try {
      const game = await Game.findOne({ roomCode });
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Join socket room
      socket.join(roomCode);
      activeConnections.set(socket.id, { roomCode, userId });

      // Update game with socket ID
      if (game.player1.userId === userId && !game.player1.socketId) {
        game.player1.socketId = socket.id;
      } else if (game.player2.userId === userId && !game.player2.socketId) {
        game.player2.socketId = socket.id;
      }
      
      await game.save();

      // Notify all clients in the room
      io.to(roomCode).emit('player-joined', {
        roomCode,
        player1: game.player1,
        player2: game.player2,
        status: game.status
      });

      // Send current game state to the newly joined player
      socket.emit('game-state', {
        board: game.board,
        currentPlayer: game.currentPlayer,
        status: game.status,
        winner: game.winner
      });

    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Handle make move
  socket.on('make-move', async ({ roomCode, row, col, userId }) => {
    try {
      const game = await Game.findOne({ roomCode });
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      if (game.status !== 'active') {
        socket.emit('error', { message: 'Game is not active' });
        return;
      }

      // Validate move
      if (game.board[row][col] !== '') {
        socket.emit('error', { message: 'Invalid move' });
        return;
      }

      // Check if it's the player's turn
      const isPlayer1 = game.player1.userId === userId;
      const expectedPlayer = game.currentPlayer;
      const playerSymbol = isPlayer1 ? 'X' : 'O';
      
      if (playerSymbol !== expectedPlayer) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      // Make the move
      game.board[row][col] = playerSymbol;
      game.moves++;
      game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';

      // Check for win
      const winner = checkWinner(game.board);
      if (winner) {
        game.status = 'completed';
        game.winner = winner;
        game.completedAt = Date.now();
        
        // Update user stats
        await updateUserStats(game, winner);
      } else if (game.moves >= 9) {
        // Check for draw
        game.status = 'completed';
        game.isDraw = true;
        game.completedAt = Date.now();
        
        // Update user stats for draw
        await updateUserStats(game, 'draw');
      }

      await game.save();

      // Broadcast move to all players in the room
      io.to(roomCode).emit('move-made', {
        board: game.board,
        row,
        col,
        player: playerSymbol,
        currentPlayer: game.currentPlayer,
        status: game.status,
        winner: game.winner,
        isDraw: game.isDraw
      });

    } catch (error) {
      console.error('Error making move:', error);
      socket.emit('error', { message: 'Failed to make move' });
    }
  });

  // Handle disconnect
  socket.on('disconnect', async () => {
    try {
      const connection = activeConnections.get(socket.id);
      
      if (connection) {
        const { roomCode } = connection;
        
        const game = await Game.findOne({ roomCode });
        if (game && game.status === 'active') {
          game.status = 'abandoned';
          await game.save();
          
          io.to(roomCode).emit('player-left', {
            message: 'A player has left the game',
            status: 'abandoned'
          });
        }
        
        activeConnections.delete(socket.id);
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
};

// Helper function to check winner
const checkWinner = (board) => {
  // Check rows
  for (let i = 0; i < 3; i++) {
    if (board[i][0] !== '' && board[i][0] === board[i][1] && board[i][1] === board[i][2]) {
      return board[i][0];
    }
  }

  // Check columns
  for (let i = 0; i < 3; i++) {
    if (board[0][i] !== '' && board[0][i] === board[1][i] && board[1][i] === board[2][i]) {
      return board[0][i];
    }
  }

  // Check diagonals
  if (board[0][0] !== '' && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0];
  }
  if (board[0][2] !== '' && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2];
  }

  return null;
};

// Update user statistics
const updateUserStats = async (game, result) => {
  try {
    const { winner, isDraw, player1, player2, moves } = game;

    if (isDraw) {
      // Update both players for draw
      if (player1.userId) {
        await User.findOneAndUpdate(
          { userId: player1.userId },
          { 
            $inc: { 
              'stats.draws': 1,
              'stats.totalGames': 1
            },
            $push: {
              matches: {
                opponent: player2.username || 'Unknown',
                result: 'draw',
                date: Date.now(),
                moves
              }
            }
          }
        );
      }
      if (player2.userId) {
        await User.findOneAndUpdate(
          { userId: player2.userId },
          { 
            $inc: { 
              'stats.draws': 1,
              'stats.totalGames': 1
            },
            $push: {
              matches: {
                opponent: player1.username || 'Unknown',
                result: 'draw',
                date: Date.now(),
                moves
              }
            }
          }
        );
      }
    } else if (winner) {
      // Update winner and loser stats
      const winnerId = winner === 'X' ? player1.userId : player2.userId;
      const loserId = winner === 'X' ? player2.userId : player1.userId;
      const winnerName = winner === 'X' ? player1.username : player2.username;
      const loserName = winner === 'X' ? player2.username : player1.username;

      if (winnerId) {
        await User.findOneAndUpdate(
          { userId: winnerId },
          { 
            $inc: { 
              'stats.wins': 1,
              'stats.totalGames': 1
            },
            $push: {
              matches: {
                opponent: loserName || 'Unknown',
                result: 'win',
                date: Date.now(),
                moves
              }
            }
          }
        );
      }

      if (loserId) {
        await User.findOneAndUpdate(
          { userId: loserId },
          { 
            $inc: { 
              'stats.losses': 1,
              'stats.totalGames': 1
            },
            $push: {
              matches: {
                opponent: winnerName || 'Unknown',
                result: 'loss',
                date: Date.now(),
                moves
              }
            }
          }
        );
      }
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

module.exports = { handleSocketConnection };

