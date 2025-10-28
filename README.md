# Tic-Tac-Toe Server

A Node.js server for multiplayer Tic-Tac-Toe game with Socket.io for real-time gameplay.

## Features

- 🎮 Real-time multiplayer gameplay using Socket.io
- 💾 MongoDB integration for game and user data
- 🔒 REST API for game management
- 📊 User statistics tracking
- 🏆 Match history

## Tech Stack

- **Express.js** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory with the following:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tic-tac-toe
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

3. Start MongoDB:
Make sure MongoDB is running on your system. For local installation:
```bash
mongod
```

Or use MongoDB Atlas for cloud hosting.

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Games

- `POST /api/games/create` - Create a new game
  - Body: `{ userId, username }`
  - Returns: `{ gameId, roomCode, status }`

- `POST /api/games/join` - Join an existing game
  - Body: `{ roomCode, userId, username }`
  - Returns: `{ gameId, roomCode, status, board, currentPlayer }`

- `GET /api/games/:gameId` - Get game by ID

- `GET /api/games/room/:roomCode` - Get game by room code

### Users

- `POST /api/users` - Create or get user
  - Body: `{ userId, username, email }`

- `GET /api/users/:userId/stats` - Get user statistics

- `GET /api/users/:userId/history` - Get user match history

## Socket.io Events

### Client → Server

- `join-room` - Join a game room
  - Data: `{ roomCode, userId, username }`

- `make-move` - Make a move in the game
  - Data: `{ roomCode, row, col, userId }`

### Server → Client

- `player-joined` - When a player joins the room
- `game-state` - Current game state
- `move-made` - When a move is made
- `player-left` - When a player disconnects
- `error` - Error messages

## Project Structure

```
Tic-Tac-Toe-Server/
├── server/
│   ├── index.js           # Main server entry point
│   ├── config/
│   │   └── database.js    # MongoDB connection
│   ├── models/
│   │   ├── Game.js        # Game model
│   │   └── User.js        # User model
│   ├── routes/
│   │   ├── gameRoutes.js  # Game API routes
│   │   └── userRoutes.js  # User API routes
│   └── socket/
│       └── socketHandler.js # Socket.io handlers
├── .env                   # Environment variables
├── package.json
└── README.md
```

## Game Rules

- Players alternate turns (X goes first)
- The game ends when:
  - A player gets 3 in a row (winner declared)
  - All 9 squares are filled (draw)
  - A player disconnects (game abandoned)

## Development

The server uses nodemon for auto-reloading during development.

## License

ISC

