// Script to toggle mock data flag
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

// Toggle mock data flag
const newMockDataValue = !currentFlags.useMockData;
const updatedFlags = {
  ...currentFlags,
  useMockData: newMockDataValue
};

// Store updated flags
localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(updatedFlags));
console.log(`Mock data ${newMockDataValue ? 'enabled' : 'disabled'}:`, updatedFlags);

// Reload the page to apply changes
window.location.reload();
