/**
 * Fix Connection Errors Script
 *
 * This script intercepts API requests and provides mock responses
 * when the backend is unavailable. It's particularly useful for
 * the showcase version where no backend server is running.
 *
 * Note: This script works in conjunction with exchange-adapter-mock.js
 * which handles exchange-specific API requests.
 */

// Intercept fetch requests for API endpoints
function interceptApiRequests() {
  // Store a reference to the original fetch function
  const originalFetch = window.fetch;

  // Override the fetch function
  window.fetch = async function(input, init) {
    const url = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

    // Only intercept API requests
    if (!url.startsWith('/api/')) {
      return originalFetch(input, init);
    }

    // Try the original fetch first
    try {
      return await originalFetch(input, init);
    } catch (error) {
      // If the request fails, return a mock response
      console.log(`Suppressed connection error for ${url} in showcase mode`);

      // Return a specific mock response based on the URL
      if (url.includes('/portfolio')) {
        console.log('Returning mock portfolio data');

        // Check if there's an exchange_id parameter
        const exchangeId = url.includes('exchange_id=')
          ? new URL(url, window.location.origin).searchParams.get('exchange_id')
          : null;

        console.log(`Portfolio request for exchange: ${exchangeId || 'all'}`);

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
      } else {
        // Return a generic success response for other requests
        return new Response(JSON.stringify({
          success: true,
          message: 'Mock data response for showcase mode',
          data: {}
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  };

  console.log('API request interception enabled for showcase mode');
}

// Call the interception function
interceptApiRequests();

console.log('Connection error fixes applied. API connection errors should be suppressed now.');
