/**
 * Fix Exchange Adapters Script
 *
 * This script ensures that all exchange adapters properly use mock data in showcase mode.
 * It intercepts all API requests and returns appropriate mock data for each endpoint.
 */

console.log('Applying fixes for exchange adapters...');

// Check if we're on GitHub Pages or in showcase mode
const isShowcase = window.location.hostname.includes('github.io') ||
                  window.location.pathname.includes('/omnitrade-terminal/') ||
                  localStorage.getItem('VITE_USE_MOCK_API') === 'true';

if (isShowcase) {
  console.log('Showcase mode detected - ensuring all exchange adapters use mock data');

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

  console.log('Mock data enabled for all exchanges:', showcaseFlags);

  // Create mock API keys for all supported exchanges
  const mockApiKeys = [
    {
      api_key_id: 'mock-key-1',
      exchange_id: 'kraken',
      key_nickname: 'Kraken Demo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_valid: true
    },
    {
      api_key_id: 'mock-key-2',
      exchange_id: 'binance',
      key_nickname: 'Binance Demo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_valid: true
    },
    {
      api_key_id: 'mock-key-3',
      exchange_id: 'coinbase',
      key_nickname: 'Coinbase Demo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_valid: true
    },
    {
      api_key_id: 'sandbox-key',
      exchange_id: 'sandbox',
      key_nickname: 'Demo Exchange',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_valid: true
    }
  ];

  // Store mock API keys in localStorage
  localStorage.setItem('exchange_api_keys', JSON.stringify(mockApiKeys));

  // Create a special handler for all API requests
  // Store a reference to the original fetch function
  const originalFetch = window.fetch || fetch;

  // Override the fetch function to intercept all API requests
  window.fetch = async function(input, init) {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    // Check if this is an API request
    if (url.includes('/api/')) {
      console.log(`[fix-exchange-adapters] Intercepted API request: ${url}`);

      // Handle portfolio API requests for any exchange
      if (url.includes('/api/portfolio')) {
        console.log(`[fix-exchange-adapters] Intercepted portfolio API request: ${url}`);

        // Check if there's an exchange_id parameter
        let exchangeId = 'all';
        try {
          const urlObj = new URL(url, window.location.origin);
          const exchangeParam = urlObj.searchParams.get('exchange_id');
          if (exchangeParam) {
            exchangeId = exchangeParam;
          }
        } catch (error) {
          console.error('Error parsing URL:', error);
        }

        console.log(`[fix-exchange-adapters] Portfolio request for exchange: ${exchangeId}`);

        // Generate mock portfolio data based on the exchange
        let portfolioData;

        if (exchangeId === 'kraken') {
          portfolioData = {
            totalUsdValue: 45000,
            assets: [
              {
                asset: 'BTC',
                free: 0.4,
                locked: 0,
                total: 0.4,
                usdValue: 25000,
                exchangeId: 'kraken'
              },
              {
                asset: 'ETH',
                free: 4,
                locked: 0,
                total: 4,
                usdValue: 10000,
                exchangeId: 'kraken'
              },
              {
                asset: 'USDT',
                free: 10000,
                locked: 0,
                total: 10000,
                usdValue: 10000,
                exchangeId: 'kraken'
              }
            ],
            lastUpdated: new Date().toISOString()
          };
        } else if (exchangeId === 'binance') {
          portfolioData = {
            totalUsdValue: 55000,
            assets: [
              {
                asset: 'BTC',
                free: 0.5,
                locked: 0,
                total: 0.5,
                usdValue: 30000,
                exchangeId: 'binance'
              },
              {
                asset: 'ETH',
                free: 5,
                locked: 0,
                total: 5,
                usdValue: 15000,
                exchangeId: 'binance'
              },
              {
                asset: 'USDT',
                free: 10000,
                locked: 0,
                total: 10000,
                usdValue: 10000,
                exchangeId: 'binance'
              }
            ],
            lastUpdated: new Date().toISOString()
          };
        } else if (exchangeId === 'coinbase') {
          portfolioData = {
            totalUsdValue: 40000,
            assets: [
              {
                asset: 'BTC',
                free: 0.3,
                locked: 0,
                total: 0.3,
                usdValue: 20000,
                exchangeId: 'coinbase'
              },
              {
                asset: 'ETH',
                free: 3,
                locked: 0,
                total: 3,
                usdValue: 10000,
                exchangeId: 'coinbase'
              },
              {
                asset: 'USDT',
                free: 10000,
                locked: 0,
                total: 10000,
                usdValue: 10000,
                exchangeId: 'coinbase'
              }
            ],
            lastUpdated: new Date().toISOString()
          };
        } else {
          // Default or 'all' portfolio
          portfolioData = {
            totalUsdValue: 140000,
            assets: [
              {
                asset: 'BTC',
                free: 1.2,
                locked: 0,
                total: 1.2,
                usdValue: 75000,
                exchangeId: 'all'
              },
              {
                asset: 'ETH',
                free: 12,
                locked: 0,
                total: 12,
                usdValue: 35000,
                exchangeId: 'all'
              },
              {
                asset: 'USDT',
                free: 30000,
                locked: 0,
                total: 30000,
                usdValue: 30000,
                exchangeId: 'all'
              }
            ],
            lastUpdated: new Date().toISOString()
          };
        }

        return new Response(JSON.stringify(portfolioData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Handle exchange API key requests
      if (url.includes('/api/user-api-keys') || url.includes('/api/exchange-api-keys')) {
        console.log(`[fix-exchange-adapters] Intercepted API key request: ${url}`);

        return new Response(JSON.stringify(mockApiKeys), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Handle any other API requests
      console.log(`[fix-exchange-adapters] Intercepted generic API request: ${url}`);

      // Return a generic success response
      return new Response(JSON.stringify({
        success: true,
        message: 'Mock data response',
        data: {}
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For all other requests, use the original fetch
    return originalFetch(input, init);
  };

  console.log('[fix-exchange-adapters] API interception enabled for all exchanges');
}

console.log('Exchange adapter fixes applied');
