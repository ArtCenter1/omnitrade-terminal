// Simplified version of server.js to test Firebase Admin SDK initialization
const express = require('express');
const admin = require('firebase-admin');
const fs = require('fs');

console.log('Starting server initialization...');

// --- Firebase Admin Initialization ---
let serviceAccount;
try {
  console.log(
    'Attempting to load Firebase Admin SDK from backend directory...',
  );
  // Use fs.readFileSync instead of require to avoid any module system issues
  const serviceAccountJson = fs.readFileSync(
    './backend/omnitrade-firebase-adminsdk.json',
    'utf8',
  );
  serviceAccount = JSON.parse(serviceAccountJson);
  console.log('Successfully loaded Firebase Admin SDK from backend directory');
} catch (error) {
  console.error(
    'Error loading Firebase Admin SDK from backend directory:',
    error,
  );
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

// Simple test endpoints
app.get('/', (req, res) => {
  res.json({ message: 'Root endpoint is working!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});
