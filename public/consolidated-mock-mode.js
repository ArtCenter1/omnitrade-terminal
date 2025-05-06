/**
 * Consolidated Mock Mode Script
 * 
 * This script combines the functionality of:
 * - fix-mock-mode.js
 * - fix-connection-errors.js
 * - fix-portfolio-errors.js
 * - fix-exchange-adapters.js
 * - ensure-mock-data.js
 * - exchange-adapter-mock.js
 * - binance-testnet-mock.js
 * 
 * Having all the functionality in one file prevents 404 errors when individual files are missing.
 */

console.log('Initializing consolidated mock mode script...');

// Check if we're on GitHub Pages or if mock mode is enabled
const isGitHubPages = window.location.hostname.includes('github.io') || 
                     window.location.pathname.includes('/omnitrade-terminal/');
const isMockModeEnabled = localStorage.getItem('VITE_USE_MOCK_API') === 'true';

// Only run if we're on GitHub Pages or mock mode is enabled
if (isGitHubPages || isMockModeEnabled) {
  console.log('Mock mode required - applying comprehensive mock mode fixes');

  // ===== MOCK MODE CONFIGURATION =====
  
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

  // ===== MOCK PORTFOLIO DATA =====
  
  // Create mock portfolio data
  const mockPortfolioData = {
    totalUsdValue: 50000,
    assets: [
      {
        asset: 'BTC',
        free: '0.5',
        locked: '0',
        total: '0.5',
        usdValue: 30000,
        exchangeId: 'sandbox'
      },
      {
        asset: 'ETH',
        free: '5',
        locked: '0',
        total: '5',
        usdValue: 15000,
        exchangeId: 'sandbox'
      },
      {
        asset: 'SOL',
        free: '50',
        locked: '0',
        total: '50',
        usdValue: 5000,
        exchangeId: 'sandbox'
      },
      {
        asset: 'USDT',
        free: '10000',
        locked: '0',
        total: '10000',
        usdValue: 10000,
        exchangeId: 'sandbox'
      }
    ],
    lastUpdated: new Date().toISOString()
  };
  
  // Store mock portfolio data in localStorage
  localStorage.setItem('mockPortfolioData', JSON.stringify(mockPortfolioData));

  // ===== FETCH INTERCEPTOR =====
  
  // Store a reference to the original fetch function
  const originalFetch = window.fetch;
  
  // Override the fetch function to intercept API requests
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' 
      ? input 
      : input instanceof URL 
        ? input.toString() 
        : input.url;
    
    console.log(`[Mock] Intercepted fetch request: ${url}`);
    
    // Check if this is an API request
    if (url.includes('/api/')) {
      // Specific portfolio request with exchange_id=sandbox
      if (url.includes('/api/portfolio?exchange_id=sandbox')) {
        console.log('[Mock] Intercepting specific sandbox portfolio request');
        
        // Create sandbox-specific portfolio data
        const sandboxPortfolio = {
          totalUsdValue: 50000,
          assets: [
            {
              asset: 'BTC',
              free: '0.5',
              locked: '0',
              total: '0.5',
              usdValue: 30000,
              exchangeId: 'sandbox'
            },
            {
              asset: 'ETH',
              free: '5',
              locked: '0',
              total: '5',
              usdValue: 15000,
              exchangeId: 'sandbox'
            },
            {
              asset: 'USDT',
              free: '10000',
              locked: '0',
              total: '10000',
              usdValue: 10000,
              exchangeId: 'sandbox'
            }
          ],
          lastUpdated: new Date().toISOString()
        };
        
        return new Response(JSON.stringify(sandboxPortfolio), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Other portfolio requests
      else if (url.includes('/portfolio')) {
        console.log('[Mock] Returning mock portfolio data');
        
        // Check if there's an exchange_id parameter
        const exchangeId = url.includes('exchange_id=')
          ? new URL(url, window.location.origin).searchParams.get('exchange_id')
          : null;
        
        console.log(`[Mock] Portfolio request for exchange: ${exchangeId || 'all'}`);
        
        // If there's a specific exchange_id, filter the assets
        if (exchangeId && exchangeId !== 'all') {
          // Create a copy of the mock data with only assets for this exchange
          const filteredData = {
            ...mockPortfolioData,
            assets: mockPortfolioData.assets.map(asset => ({
              ...asset,
              exchangeId: exchangeId // Set the exchangeId to match the request
            }))
          };
          
          return new Response(JSON.stringify(filteredData), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Return the full mock portfolio data for 'all' exchanges
        return new Response(JSON.stringify(mockPortfolioData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Binance Testnet requests
      if (url.includes('/proxy/binance-testnet') || url.includes('testnet.binance.vision')) {
        console.log('[Mock] Returning mock Binance Testnet data');
        return new Response(JSON.stringify({
          success: true,
          message: 'Mock Binance Testnet response',
          data: {}
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // For any other API request, return a generic success response
      console.log('[Mock] Returning generic success response for API request');
      return new Response(JSON.stringify({
        success: true,
        message: 'Mock data response for showcase mode',
        data: {}
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For non-API requests, use the original fetch
    try {
      return await originalFetch(input, init);
    } catch (error) {
      console.error(`[Mock] Error in original fetch: ${error.message}`);
      
      // If the request fails and it's a resource, return a mock response
      return new Response(JSON.stringify({
        success: false,
        message: 'Resource not available in showcase mode',
        error: error.message
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
  
  console.log('Consolidated mock mode script applied successfully');
} else {
  console.log('Mock mode not required - skipping mock mode setup');
}
