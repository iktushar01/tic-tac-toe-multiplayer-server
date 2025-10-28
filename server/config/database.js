const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  try {
    // MongoDB Atlas connection string
    const uri = process.env.MONGODB_URI || "mongodb+srv://<db_username>:<db_password>@learningproject.3djrvwy.mongodb.net/tic-tac-toe?retryWrites=true&w=majority&appName=learningProject";
    
    const conn = await mongoose.connect(uri, {
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    });

    isConnected = true;
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.log('⚠️  Server will continue without database connection');
    console.log('💡 Update .env file with your MongoDB credentials to enable persistence');
    // Don't exit - let server run without DB
  }
};

// Export connection status
module.exports = connectDB;
module.exports.isConnected = () => isConnected;

