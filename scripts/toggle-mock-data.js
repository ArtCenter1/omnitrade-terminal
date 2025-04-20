// Script to toggle mock data flag
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to get the path to the local storage file
function getLocalStoragePath() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  
  // Different paths for different browsers and OS
  const possiblePaths = [
    // Chrome on Windows
    path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Local Storage', 'leveldb'),
    // Chrome on macOS
    path.join(homeDir, 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'Local Storage', 'leveldb'),
    // Chrome on Linux
    path.join(homeDir, '.config', 'google-chrome', 'Default', 'Local Storage', 'leveldb'),
    // Edge on Windows
    path.join(homeDir, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Local Storage', 'leveldb'),
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  
  return null;
}

// Main function
function main() {
  console.log('OmniTrade Mock Data Toggler');
  console.log('==========================');
  console.log('');
  console.log('This script cannot directly modify browser local storage.');
  console.log('Instead, you can use one of these methods:');
  console.log('');
  console.log('1. Open the browser console and run:');
  console.log('   const FEATURE_FLAGS_STORAGE_KEY = "omnitrade_feature_flags";');
  console.log('   const flags = JSON.parse(localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY) || "{}");');
  console.log('   flags.useMockData = !flags.useMockData;');
  console.log('   localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(flags));');
  console.log('   console.log(`Mock data ${flags.useMockData ? "enabled" : "disabled"}`);');
  console.log('   location.reload();');
  console.log('');
  console.log('2. Open the Developer Tools page in the application and use the feature flag toggle');
  console.log('');
  console.log('3. Open this URL in your browser:');
  console.log('   http://localhost:8080/toggle-mock-data.html');
  console.log('');
  
  rl.question('Press Enter to exit...', () => {
    rl.close();
  });
}

// Run the main function
main();
