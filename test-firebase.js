import { readFileSync } from 'fs';

try {
  console.log(
    'Attempting to load Firebase Admin SDK from backend directory...',
  );
  const serviceAccount = JSON.parse(
    readFileSync('./backend/omnitrade-firebase-adminsdk.json', 'utf8'),
  );
  console.log('Successfully loaded Firebase Admin SDK from backend directory');
  console.log(serviceAccount);
} catch (error) {
  console.error(
    'Error loading Firebase Admin SDK from backend directory:',
    error,
  );
}

try {
  console.log('\nAttempting to load Firebase Admin SDK from root directory...');
  const serviceAccount = JSON.parse(
    readFileSync('./omnitrade-firebase-adminsdk.json', 'utf8'),
  );
  console.log('Successfully loaded Firebase Admin SDK from root directory');
  console.log(serviceAccount);
} catch (error) {
  console.error('Error loading Firebase Admin SDK from root directory:', error);
}
