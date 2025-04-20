// Script to enable mock data
const FEATURE_FLAGS_STORAGE_KEY = 'omnitrade_feature_flags';

// Get current flags
let currentFlags = {};
try {
  const storedFlags = localStorage.getItem(FEATURE_FLAGS_STORAGE_KEY);
  if (storedFlags) {
    currentFlags = JSON.parse(storedFlags);
  }
} catch (error) {
  console.error('Error getting feature flags:', error);
}

// Enable mock data
const updatedFlags = {
  ...currentFlags,
  useMockData: true
};

// Store updated flags
localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(updatedFlags));
console.log('Mock data enabled:', updatedFlags);

// Also enable mock user
localStorage.setItem('useMockUser', 'true');
console.log('Mock user enabled');

// Reload the page
window.location.reload();
