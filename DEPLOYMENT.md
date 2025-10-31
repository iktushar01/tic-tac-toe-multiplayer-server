# Deployment Guide for Vercel

## Project Structure

The Vercel deployment uses a serverless function handler located at `api/index.js`. This file exports the Express app without starting an HTTP server, which is required for Vercel's serverless functions.

**Important**: The original `server/index.js` file is kept for local development and traditional server deployments.

## Important Note: Socket.io Limitations

⚠️ **Vercel's serverless functions do not fully support WebSocket connections**, which Socket.io requires for real-time communication. The REST API routes will work, but Socket.io features (real-time game updates, friend request notifications) will not function on Vercel. The code gracefully handles missing Socket.io by checking `if (io)` before emitting events.

### Recommended Solutions:

1. **Use Vercel for REST API only**: Deploy the REST API routes to Vercel and use a separate service for Socket.io (Railway, Render, Heroku, or a VPS)
2. **Alternative Services**: Consider deploying the entire server to:
   - **Railway**: Full support for Socket.io and WebSockets
   - **Render**: Good support for Socket.io with persistent connections
   - **Heroku**: Traditional server deployment with Socket.io support
   - **DigitalOcean App Platform**: Full support for WebSocket connections

## Environment Variables

Before deploying, set the following environment variables in Vercel:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

```
PORT=3000
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=your_netlify_client_url
NODE_ENV=production
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

## Deployment Steps

1. **Install Vercel CLI** (if using CLI):
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   cd Tic-Tac-Toe-Server
   vercel
   ```

3. **Or connect via GitHub**:
   - Push your code to GitHub
   - Connect your repository to Vercel
   - Vercel will automatically detect the `vercel.json` configuration

4. **Set Environment Variables** in Vercel dashboard

5. **Deploy**

## Firebase Private Key Format

When setting `FIREBASE_PRIVATE_KEY` in Vercel, make sure to:
- Replace `\n` with actual newlines or use the full key as a single string
- Keep the quotes around the entire key
- Ensure the key is properly formatted

Example:
```
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

## API Routes

The following routes will be available:
- `GET /` - Health check
- `POST /api/users/login` - Firebase authentication
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update profile
- `POST /api/games/create` - Create game
- `POST /api/games/join` - Join game
- And more...

## Testing

After deployment, test your API:

### Health Check
```bash
curl https://your-vercel-url.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "mongo": "connected"
}
```

### Root Endpoint
```bash
curl https://your-vercel-url.vercel.app/
```

Expected response:
```json
{
  "message": "Tic Tac Toe Server is running on Vercel!"
}
```

### API Routes
```bash
# Test user login endpoint
curl -X POST https://your-vercel-url.vercel.app/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "your-firebase-token"}'
```

## Troubleshooting

### 404 NOT_FOUND Error

If you're getting a 404 error at your Vercel URL, follow these steps:

#### 1. Verify File Structure
Ensure your project structure looks like this:
```
Tic-Tac-Toe-Server/
├── api/
│   └── index.js  ← This file must exist
├── server/
│   ├── config/
│   ├── routes/
│   └── ...
├── vercel.json
└── package.json
```

#### 2. Check Vercel Deployment Logs
1. Go to your Vercel dashboard
2. Navigate to your project
3. Click on the latest deployment
4. Check the "Build Logs" and "Function Logs" for errors

Common errors:
- `Cannot find module` - Check that all dependencies are in `package.json`
- `Path resolution errors` - Verify relative paths in `api/index.js`
- `Initialization errors` - Check MongoDB/Firebase configuration

#### 3. Verify vercel.json Configuration
Your `vercel.json` should be simple:
```json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 60
    }
  }
}
```

#### 4. Test the Function Directly
Try accessing:
- `https://your-app.vercel.app/api/test` (if test.js exists)
- `https://your-app.vercel.app/` (should hit index.js)
- `https://your-app.vercel.app/health` (health check)

#### 5. Redeploy
After making changes:
1. Commit and push to your repository
2. Vercel will auto-deploy
3. Or manually redeploy from Vercel dashboard

#### 6. Check Environment Variables
Ensure all required environment variables are set in Vercel dashboard under Settings → Environment Variables

### Database Connection Issues

If MongoDB connections fail:
- Check `MONGODB_URI` environment variable is set correctly
- Verify MongoDB Atlas IP whitelist includes Vercel's IPs (use `0.0.0.0/0` for testing)
- Check MongoDB connection string format

### Common Issues

1. **Path Errors**: Make sure all require paths in `api/index.js` use relative paths correctly (`../server/...`)
2. **Module Not Found**: Ensure all dependencies are in `package.json`
3. **CORS Issues**: Update `CLIENT_URL` environment variable to your Netlify domain

