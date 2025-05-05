// Script to enable mock API and disable backend connections
console.log('Enabling mock API and disabling backend connections...');

// Set environment variables in localStorage
localStorage.setItem('VITE_USE_MOCK_API', 'true');
localStorage.setItem('VITE_DISABLE_BACKEND_FEATURES', 'true');

// Enable mock user
localStorage.setItem('useMockUser', 'true');

// Set feature flags
const FEATURE_FLAGS_STORAGE_KEY = 'omnitrade_feature_flags';
const featureFlags = {
  useMockData: true,
  useRealMarketData: false,
  connectionMode: 'mock',
  enableDemoAccount: true,
  enableDebugTools: true,
  showPerformanceMetrics: false,
};

localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(featureFlags));
console.log('Feature flags set:', featureFlags);

console.log('Mock API enabled. Please refresh the page.');
