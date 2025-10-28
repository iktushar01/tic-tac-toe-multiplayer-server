# Tic-Tac-Toe Server

A Node.js server for multiplayer Tic-Tac-Toe game with Socket.io for real-time gameplay.

## Features

- 🎮 Real-time multiplayer gameplay using Socket.io
- 💾 MongoDB integration for game and user data
- 🔒 REST API for game management
- 📊 User statistics tracking
- 🏆 Match history
- 🔐 Firebase Authentication integration
- 👤 User session management

## Tech Stack

- **Express.js** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **Firebase Admin** - Firebase authentication verification
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Firebase project with Authentication enabled
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase Admin:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file and copy the values to your `.env` file

3. Set up environment variables:
Create a `.env` file in the root directory with the following:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tic-tac-toe
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Firebase Configuration (from Service Account JSON)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
```

**Important:** The `FIREBASE_PRIVATE_KEY` should include the actual private key from your Firebase service account JSON file. Make sure to preserve the `\n` characters in the key.

4. Start MongoDB:
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

- `POST /api/users/login` - Firebase authentication
  - Body: `{ idToken }` (Firebase ID token)
  - Returns: User object with stats

- `GET /api/users/me` - Get current authenticated user (requires Bearer token)
  - Headers: `Authorization: Bearer <token>`
  - Returns: User object with stats and timestamps

- `PUT /api/users/me` - Update user profile (requires Bearer token)
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ username: string, email: string }`
  - Returns: Updated user object

- `DELETE /api/users/me` - Delete user account (requires Bearer token)
  - Headers: `Authorization: Bearer <token>`
  - Returns: Confirmation message

- `POST /api/users` - Create or get user (legacy endpoint)
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
│   │   ├── database.js    # MongoDB connection
│   │   └── firebase.js    # Firebase Admin configuration
│   ├── middleware/
│   │   └── auth.js        # Firebase authentication middleware
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

## Authentication Flow

1. User logs in with Firebase (email/password or Google)
2. Client sends Firebase ID token to `/api/users/login`
3. Server verifies token and creates/updates user in MongoDB
4. Server returns user data including stats
5. All subsequent requests include Bearer token in Authorization header

## Game Rules

- Players alternate turns (X goes first)
- The game ends when:
  - A player gets 3 in a row (winner declared)
  - All 9 squares are filled (draw)
  - A player disconnects (game abandoned)

## Development

The server uses nodemon for auto-reloading during development.

## Troubleshooting

### Firebase Authentication Issues
- Ensure `FIREBASE_PRIVATE_KEY` includes the full key with `\n` newline characters
- Check that your Firebase project has Authentication enabled
- Verify the service account email matches your `.env` configuration

### MongoDB Connection Issues
- Check that MongoDB is running
- Verify the connection string in `.env`
- For MongoDB Atlas, ensure your IP is whitelisted

## License

ISC

