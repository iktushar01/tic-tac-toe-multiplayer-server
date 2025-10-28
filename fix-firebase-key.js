// Helper script to format Firebase private key from JSON
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📝 Firebase Private Key Formatter\n');
console.log('This will help you properly format your Firebase private key for .env file\n');

rl.question('Enter the path to your downloaded Firebase JSON file: ', (jsonPath) => {
  try {
    const fullPath = path.resolve(jsonPath);
    
    if (!fs.existsSync(fullPath)) {
      console.error('\n❌ File not found:', fullPath);
      rl.close();
      return;
    }

    const jsonData = fs.readFileSync(fullPath, 'utf8');
    const firebaseConfig = JSON.parse(jsonData);

    console.log('\n✅ Successfully loaded Firebase credentials!\n');
    console.log('Your .env file should have these values:\n');
    console.log('FIREBASE_PROJECT_ID=' + firebaseConfig.project_id);
    console.log('FIREBASE_CLIENT_EMAIL=' + firebaseConfig.client_email);
    console.log('\nFIREBASE_PRIVATE_KEY="' + firebaseConfig.private_key + '"');
    
    // Update the .env file
    rl.question('\n\nDo you want to update your .env file automatically? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        const envPath = path.join(__dirname, '.env');
        
        if (!fs.existsSync(envPath)) {
          console.error('\n❌ .env file not found!');
          rl.close();
          return;
        }

        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Update FIREBASE_PRIVATE_KEY
        envContent = envContent.replace(
          /FIREBASE_PRIVATE_KEY=.*/,
          'FIREBASE_PRIVATE_KEY="' + firebaseConfig.private_key + '"'
        );
        
        // Update FIREBASE_CLIENT_EMAIL
        envContent = envContent.replace(
          /FIREBASE_CLIENT_EMAIL=.*/,
          'FIREBASE_CLIENT_EMAIL=' + firebaseConfig.client_email
        );
        
        // Update FIREBASE_PROJECT_ID
        envContent = envContent.replace(
          /FIREBASE_PROJECT_ID=.*/,
          'FIREBASE_PROJECT_ID=' + firebaseConfig.project_id
        );
        
        fs.writeFileSync(envPath, envContent);
        
        console.log('\n✅ .env file updated successfully!');
        console.log('\nRestart your server with: npm run dev');
      }
      
      rl.close();
    });
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
  }
});

