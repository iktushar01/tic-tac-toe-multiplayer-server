# ⚡ Quick Start Guide

## 🚀 Starting the Server

### In your terminal (where you see nodemon), do one of these:

**Option 1 - Manual Restart:**
1. Press `Ctrl + C` to stop the current process
2. Run: `npm run dev`

**Option 2 - Force Restart in Nodemon:**
1. Type `rs` and press Enter in the nodemon terminal

## ✅ Expected Output

Once the server starts, you should see:

```
✅ MongoDB Atlas Connected: [your cluster]
📊 Database: tic-tac-toe
🚀 Server is running on port 3000
📡 Socket.io server ready
🔗 API available at http://localhost:3000
```

## ⚠️ If You See MongoDB Connection Error

That's OK! The server will still run. You'll see:
```
❌ MongoDB connection error: [error message]
⚠️  Server will continue without database connection
💡 Update .env file with your MongoDB credentials to enable persistence
```

The server will work in **memory mode** until you add your MongoDB Atlas credentials.

## 🧪 Test Your Server

Once running, open a new terminal and test:

```bash
curl http://localhost:3000
```

Should return:
```json
{"message":"Tic Tac Toe Server is running!"}
```

## 📝 Adding MongoDB Credentials (Optional but Recommended)

Edit `Tic-Tac-Toe-Server/.env`:
```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@learningproject.3djrvwy.mongodb.net/tic-tac-toe?retryWrites=true&w=majority&appName=learningProject
```

Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your actual credentials.

