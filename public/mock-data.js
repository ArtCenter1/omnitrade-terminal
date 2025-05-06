/**
 * Simple Mock Data Script
 * 
 * This provides basic mock data for the OmniTrade Terminal frontend UI
 * without requiring any backend connections.
 */

console.log('Initializing simple mock data...');

// Set environment variables in localStorage
localStorage.setItem('VITE_USE_MOCK_API', 'true');
localStorage.setItem('VITE_DISABLE_BACKEND_FEATURES', 'true');
localStorage.setItem('useMockUser', 'true');

// Set feature flags
const FEATURE_FLAGS_STORAGE_KEY = 'omnitrade_feature_flags';
const featureFlags = {
  useMockData: true,
  useRealMarketData: false,
  connectionMode: 'mock',
  enableDemoAccount: true,
  disableCoinGeckoApi: true
};
localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(featureFlags));

// Create mock portfolio data
const mockPortfolioData = {
  totalUsdValue: 50000,
  assets: [
    { asset: 'BTC', free: '0.5', locked: '0', total: '0.5', usdValue: 30000 },
    { asset: 'ETH', free: '5', locked: '0', total: '5', usdValue: 15000 },
    { asset: 'SOL', free: '50', locked: '0', total: '50', usdValue: 5000 },
    { asset: 'USDT', free: '10000', locked: '0', total: '10000', usdValue: 10000 }
  ],
  lastUpdated: new Date().toISOString()
};
localStorage.setItem('mockPortfolioData', JSON.stringify(mockPortfolioData));

// Create mock user data
const mockUser = {
  id: 'demo-user',
  username: 'demo',
  email: 'demo@example.com',
  displayName: 'Demo User',
  role: 'user'
};
localStorage.setItem('mockUser', JSON.stringify(mockUser));

console.log('Mock data initialization complete');
