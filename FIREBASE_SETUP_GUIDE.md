# Firebase Admin Setup Guide

## Step-by-Step Instructions

### Step 1: Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **tic-tac-toe-online-dbf10**
3. Click the gear icon ⚙️ next to "Project Overview"
4. Select **"Project settings"**
5. Go to the **"Service accounts"** tab
6. Click **"Generate new private key"**
7. Click **"Generate key"** in the popup
8. A JSON file will download (e.g., `tic-tac-toe-online-dbf10-firebase-adminsdk-xxxxx.json`)

### Step 2: Extract Credentials from JSON

Open the downloaded JSON file. It looks like this:

```json
{
  "type": "service_account",
  "project_id": "tic-tac-toe-online-dbf10",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@tic-tac-toe-online-dbf10.iam.gserviceaccount.com",
  ...
}
```

### Step 3: Update .env File

Open the `.env` file in `Tic-Tac-Toe-Server` and replace:

1. **FIREBASE_PRIVATE_KEY**: Copy the entire `private_key` value (including the BEGIN/END lines)
2. **FIREBASE_CLIENT_EMAIL**: Copy the `client_email` value

**Important**: 
- Keep the quotes around FIREBASE_PRIVATE_KEY
- Keep the `\n` characters (they represent newlines)
- The format should be: `"-----BEGIN PRIVATE KEY-----\n[your key here]\n-----END PRIVATE KEY-----\n"`

### Step 4: Example .env File

Here's what your `.env` should look like:

```env
PORT=3000
MONGODB_URI=your_mongodb_uri_here
CLIENT_URL=http://localhost:5173
NODE_ENV=development

FIREBASE_PROJECT_ID=tic-tac-toe-online-dbf10
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-abc123@tic-tac-toe-online-dbf10.iam.gserviceaccount.com
```

### Step 5: Update MongoDB URI

Replace `<db_username>` and `<db_password>` with your actual MongoDB Atlas credentials in the `.env` file.

### Step 6: Test the Setup

1. Start the server:
   ```bash
   cd Tic-Tac-Toe-Server
   npm run dev
   ```

2. Look for this message in the console:
   ```
   ✅ Firebase Admin initialized successfully
   ```

3. If you see "Firebase Admin not configured", double-check:
   - The `.env` file exists in `Tic-Tac-Toe-Server` folder
   - All Firebase variables are set correctly
   - The quotes and formatting are correct
   - You restarted the server after adding/updating `.env`

### Security Note

⚠️ **Never commit your `.env` file to Git!** The `.gitignore` file should already exclude it, but make sure it's not uploaded to version control.

## Troubleshooting

### "Invalid token" errors
- Verify the private key is copied correctly
- Make sure there are no extra spaces or broken lines
- Check that the quotes are preserved

### "Firebase Admin not configured"
- Ensure `.env` file exists in the server root directory
- Verify all three Firebase variables are set
- Restart the server after changes

### Can't find Service Accounts
- Make sure you're using an Owner or Admin account
- Try accessing from another browser
- Check if the project is properly initialized

## Quick Start

If you just want to test without full Firebase setup, the server will work with mock authentication, but features requiring Firebase will be limited.

