// Simplified version of server.js to test Firebase Admin SDK initialization
const express = require('express');
const admin = require('firebase-admin');

console.log('Starting server initialization...');

// --- Firebase Admin Initialization ---
let serviceAccount;
try {
  console.log('Attempting to load Firebase Admin SDK from backend directory...');
  serviceAccount = require('./backend/omnitrade-firebase-adminsdk.json');
  console.log('Successfully loaded Firebase Admin SDK from backend directory');
} catch (error) {
  console.error('Error loading Firebase Admin SDK from backend directory:', error);
  process.exit(1);
}

try {
  console.log('Initializing Firebase Admin SDK...');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

const app = express();
app.use(express.json());

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
