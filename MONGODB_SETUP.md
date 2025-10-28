# 🗄️ MongoDB Atlas Setup Instructions

## 📝 Current Configuration

Your server is configured to use MongoDB Atlas:
- **Cluster**: learningproject.3djrvwy.mongodb.net
- **Database**: tic-tac-toe

## 🔑 Adding Your Credentials

### Step 1: Get Your MongoDB Atlas Credentials

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Go to your project dashboard
3. Click **Database Access** in the left sidebar
4. Find your database user or create a new one
5. Click **Edit** on your user
6. Note your username and reset/note your password

### Step 2: Update the .env File

Open `Tic-Tac-Toe-Server/.env` and replace the placeholders:

```env
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@learningproject.3djrvwy.mongodb.net/tic-tac-toe?retryWrites=true&w=majority&appName=learningProject
```

**Important**: Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your actual MongoDB Atlas credentials.

### Step 3: Configure Network Access

1. Go to **Network Access** in MongoDB Atlas
2. Click **Add IP Address**
3. Either:
   - Click **Allow Access from Anywhere** (for development)
   - Or add your specific IP address

### Step 4: Restart the Server

After updating the `.env` file, restart your server:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## ✅ Verification

Once configured, you should see:

```
✅ MongoDB Atlas Connected: learningproject-shard-00-00.3djrvwy.mongodb.net:27017
📊 Database: tic-tac-toe
```

## 🛡️ Security Tips

1. **Never commit your .env file** - It's already in .gitignore
2. **Use environment variables** in production
3. **Create a separate database user** for the application
4. **Use IP whitelisting** instead of allowing all IPs in production

## 🔄 Current Status

Your server will attempt to connect to MongoDB Atlas. If the credentials are not set yet:
- Server will still run
- Games will work in memory only (no persistence)
- Once you add credentials, data will be saved to MongoDB Atlas

## 🚀 Alternative: Use MongoDB Local

If you prefer to use MongoDB locally instead:

1. Install MongoDB on your machine
2. Update `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/tic-tac-toe
   ```

