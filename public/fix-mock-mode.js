// Script to fix mock mode and prevent backend connection errors
console.log('Applying mock mode fixes to prevent backend connection errors...');

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
  disableCoinGeckoApi: true, // Disable CoinGecko API to prevent connection errors
};

localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(featureFlags));
console.log('Feature flags set:', featureFlags);

// Enhance the API middleware to completely suppress backend connection errors
function enhanceApiMiddleware() {
  // Wait for the original API middleware to be set up
  const checkInterval = setInterval(() => {
    if (window.originalFetch) {
      clearInterval(checkInterval);
      console.log('Enhancing API middleware to suppress connection errors...');
      
      // Store a reference to the current fetch (which might be the middleware-enhanced version)
      const currentFetch = window.fetch;
      
      // Override fetch again to add additional error handling
      window.fetch = async function(input, init) {
        const url = typeof input === 'string' 
          ? input 
          : input instanceof URL 
            ? input.toString() 
            : input.url;
        
        // Only intercept API requests
        if (!url.startsWith('/api/')) {
          return currentFetch(input, init);
        }
        
        // For API requests, wrap in try/catch to suppress errors
        try {
          return await currentFetch(input, init);
        } catch (error) {
          console.log(`Suppressed error for ${url} in mock mode`);
          
          // Return a mock response based on the URL
          if (url.includes('/portfolio')) {
            return new Response(JSON.stringify({
              success: true,
              data: {
                assets: [
                  { asset: 'BTC', free: '0.5', locked: '0', total: '0.5' },
                  { asset: 'ETH', free: '5', locked: '0', total: '5' },
                  { asset: 'USDT', free: '10000', locked: '0', total: '10000' }
                ]
              },
              message: 'Mock portfolio data'
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Generic mock response for other endpoints
          return new Response(JSON.stringify({
            success: true,
            message: 'Mock data response',
            data: {}
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      };
      
      console.log('API middleware enhanced successfully');
    }
  }, 100);
  
  // Clear the interval after 10 seconds to prevent memory leaks
  setTimeout(() => clearInterval(checkInterval), 10000);
}

// Call the enhancement function
enhanceApiMiddleware();

console.log('Mock mode fixes applied. Please refresh the page if you still see connection errors.');
