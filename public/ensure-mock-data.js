/**
 * Ensure Mock Data Script
 *
 * This script ensures that mock data is properly enabled for the showcase version.
 * It runs before the application starts and sets the necessary flags in localStorage.
 */

// Check if we're on GitHub Pages or in showcase mode
const isShowcase = window.location.hostname.includes('github.io') ||
                  window.location.pathname.includes('/omnitrade-terminal/');

if (isShowcase) {
  console.log('Showcase mode detected - ensuring mock data is enabled');

  // Set environment variables in localStorage
  localStorage.setItem('VITE_USE_MOCK_API', 'true');
  localStorage.setItem('VITE_DISABLE_BACKEND_FEATURES', 'true');

  // Enable mock user
  localStorage.setItem('useMockUser', 'true');

  // Set feature flags
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

  // Update flags for showcase mode
  const showcaseFlags = {
    ...currentFlags,
    useMockData: true,
    useRealMarketData: false,
    connectionMode: 'mock',
    enableDemoAccount: true,
    enableDebugTools: true,
    showPerformanceMetrics: false,
    disableCoinGeckoApi: true, // Disable CoinGecko API to prevent connection errors
  };

  // Store updated flags
  localStorage.setItem(FEATURE_FLAGS_STORAGE_KEY, JSON.stringify(showcaseFlags));

  console.log('Mock data enabled for showcase mode:', showcaseFlags);
}

// Define a global variable to indicate showcase mode
window.SHOWCASE_MODE = isShowcase;

// Create a special handler for portfolio requests
if (isShowcase) {
  // Store a reference to the original fetch function
  const originalFetch = window.fetch || fetch;

  // Override the fetch function to intercept portfolio requests
  window.fetch = async function(input, init) {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    // Check if this is a portfolio API request
    if (url.includes('/api/portfolio')) {
      console.log(`[ensure-mock-data] Intercepted portfolio API request: ${url}`);

      // Check if there's an exchange_id parameter
      const exchangeId = url.includes('exchange_id=')
        ? new URL(url, window.location.origin).searchParams.get('exchange_id')
        : null;

      console.log(`[ensure-mock-data] Portfolio request for exchange: ${exchangeId || 'all'}`);

      // Create portfolio data in the correct format
      const portfolioData = {
        totalUsdValue: 50000,
        assets: [
          {
            asset: 'BTC',
            free: '0.5',
            locked: '0',
            total: '0.5',
            usdValue: 30000,
            exchangeId: exchangeId || 'all'
          },
          {
            asset: 'ETH',
            free: '5',
            locked: '0',
            total: '5',
            usdValue: 15000,
            exchangeId: exchangeId || 'all'
          },
          {
            asset: 'USDT',
            free: '10000',
            locked: '0',
            total: '10000',
            usdValue: 10000,
            exchangeId: exchangeId || 'all'
          }
        ],
        lastUpdated: new Date().toISOString()
      };

      return new Response(JSON.stringify(portfolioData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For all other requests, use the original fetch
    return originalFetch(input, init);
  };

  console.log('[ensure-mock-data] Portfolio API interception enabled');
}

console.log('Mock data configuration complete');
