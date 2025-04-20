// Script to reset all mock data and feature flags
console.log('Resetting all mock data and feature flags...');

// Reset feature flags
const FEATURE_FLAGS_STORAGE_KEY = 'omnitrade_feature_flags';
localStorage.removeItem(FEATURE_FLAGS_STORAGE_KEY);
console.log('Feature flags reset to defaults');

// Reset mock admin data
localStorage.removeItem('mockAdminData');
console.log('Mock admin data reset');

// Reset exchange API keys
localStorage.removeItem('exchange_api_keys');
console.log('Exchange API keys reset');

// Enable mock user
localStorage.setItem('useMockUser', 'true');
console.log('Mock user enabled');

// Set feature flags
const defaultFeatureFlags = {
  useMockData: true,
  useRealMarketData: false,
  connectionMode: 'mock',
  enableSandboxAccount: true,
  enableDebugTools: true,
  showPerformanceMetrics: false
};
localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(defaultFeatureFlags));
console.log('Feature flags set:', defaultFeatureFlags);

console.log('Reset complete. Please refresh the page.');
