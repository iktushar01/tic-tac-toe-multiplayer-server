const admin = require('firebase-admin');

// Initialize Firebase Admin
const initializeFirebase = () => {
  if (admin.apps.length === 0) {
    try {
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      // Check if Firebase is configured
      if (!privateKey || privateKey === 'YOUR_PRIVATE_KEY_HERE' || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
        console.log('⚠️  Firebase Admin not configured - using mock authentication');
        console.log('💡 Add Firebase credentials to .env file to enable Firebase authentication');
        return false;
      }

      // Remove quotes if present and convert \n to actual newlines
      privateKey = privateKey.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '\n');
      
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
        }),
      });

      console.log('✅ Firebase Admin initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Firebase Admin initialization error:', error.message);
      console.log('⚠️  Server will continue without Firebase authentication');
      return false;
    }
  }
  return true;
};

// Verify Firebase ID token
const verifyToken = async (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

module.exports = {
  initializeFirebase,
  verifyToken,
  admin,
};

