/**
 * Exchange Adapter Mock
 * 
 * This script intercepts all exchange-related API requests and provides mock responses.
 * It's designed to work with the showcase version where no backend server is running.
 */

console.log('Initializing Exchange Adapter Mock...');

// Store a reference to the original fetch function
const originalFetch = window.fetch;

// Mock data for different exchange endpoints
const mockData = {
  // Exchange info
  exchangeInfo: {
    id: 'mock_exchange',
    name: 'Mock Exchange',
    logo: '/exchange-logos/sandbox.svg',
    website: 'https://example.com',
    description: 'Mock exchange for showcase version',
    isActive: true
  },
  
  // Trading pairs
  tradingPairs: [
    { 
      symbol: 'BTC/USDT', 
      baseAsset: 'BTC', 
      quoteAsset: 'USDT', 
      exchangeId: 'mock_exchange',
      priceDecimals: 2,
      quantityDecimals: 6,
      minQuantity: 0.0001,
      maxQuantity: 1000,
      minPrice: 1,
      maxPrice: 1000000,
      minNotional: 10
    },
    { 
      symbol: 'ETH/USDT', 
      baseAsset: 'ETH', 
      quoteAsset: 'USDT', 
      exchangeId: 'mock_exchange',
      priceDecimals: 2,
      quantityDecimals: 6,
      minQuantity: 0.001,
      maxQuantity: 10000,
      minPrice: 1,
      maxPrice: 100000,
      minNotional: 10
    },
    { 
      symbol: 'SOL/USDT', 
      baseAsset: 'SOL', 
      quoteAsset: 'USDT', 
      exchangeId: 'mock_exchange',
      priceDecimals: 2,
      quantityDecimals: 6,
      minQuantity: 0.01,
      maxQuantity: 100000,
      minPrice: 0.1,
      maxPrice: 10000,
      minNotional: 10
    }
  ],
  
  // Portfolio data
  portfolio: {
    totalUsdValue: 50000,
    assets: [
      { 
        asset: 'BTC', 
        free: '0.5', 
        locked: '0', 
        total: '0.5',
        usdValue: 30000,
        exchangeId: 'mock_exchange'
      },
      { 
        asset: 'ETH', 
        free: '5', 
        locked: '0', 
        total: '5',
        usdValue: 15000,
        exchangeId: 'mock_exchange'
      },
      { 
        asset: 'SOL', 
        free: '50', 
        locked: '0', 
        total: '50',
        usdValue: 5000,
        exchangeId: 'mock_exchange'
      },
      { 
        asset: 'USDT', 
        free: '10000', 
        locked: '0', 
        total: '10000',
        usdValue: 10000,
        exchangeId: 'mock_exchange'
      }
    ],
    lastUpdated: new Date().toISOString()
  },
  
  // Order book data
  orderBook: {
    symbol: 'BTC/USDT',
    bids: Array.from({ length: 20 }, (_, i) => [65000 - i * 10, Math.random() * 2]),
    asks: Array.from({ length: 20 }, (_, i) => [65000 + i * 10, Math.random() * 2]),
    timestamp: Date.now()
  },
  
  // Recent trades data
  recentTrades: Array.from({ length: 50 }, (_, i) => ({
    id: `mock-trade-${i}`,
    symbol: 'BTC/USDT',
    price: 65000 + (Math.random() * 1000 - 500),
    quantity: Math.random() * 2,
    time: Date.now() - i * 60000,
    isBuyer: Math.random() > 0.5
  })),
  
  // Ticker stats
  tickerStats: {
    symbol: 'BTC/USDT',
    priceChange: 1200,
    priceChangePercent: 1.8,
    lastPrice: 65000,
    openPrice: 63800,
    highPrice: 65500,
    lowPrice: 63500,
    volume: 1000,
    quoteVolume: 65000000,
    openTime: Date.now() - 24 * 60 * 60 * 1000,
    closeTime: Date.now(),
    count: 50000
  }
};

// Override the fetch function to intercept exchange-related API requests
window.fetch = async function(input, init) {
  const url = typeof input === 'string' 
    ? input 
    : input instanceof URL 
      ? input.toString() 
      : input.url;
  
  console.log(`[Exchange Mock] Intercepted request: ${url}`);
  
  // Check if this is an exchange-related API request
  if (url.includes('/api/')) {
    // Portfolio requests
    if (url.includes('/portfolio')) {
      console.log('[Exchange Mock] Returning mock portfolio data');
      return new Response(JSON.stringify(mockData.portfolio), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Order book requests
    if (url.includes('/orderbook') || url.includes('/depth')) {
      console.log('[Exchange Mock] Returning mock order book data');
      return new Response(JSON.stringify(mockData.orderBook), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Recent trades requests
    if (url.includes('/trades')) {
      console.log('[Exchange Mock] Returning mock recent trades data');
      return new Response(JSON.stringify(mockData.recentTrades), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Ticker stats requests
    if (url.includes('/ticker') || url.includes('/stats')) {
      console.log('[Exchange Mock] Returning mock ticker stats data');
      return new Response(JSON.stringify(mockData.tickerStats), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Exchange info requests
    if (url.includes('/exchangeInfo') || url.includes('/exchange')) {
      console.log('[Exchange Mock] Returning mock exchange info data');
      return new Response(JSON.stringify(mockData.exchangeInfo), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Trading pairs requests
    if (url.includes('/symbols') || url.includes('/pairs') || url.includes('/markets')) {
      console.log('[Exchange Mock] Returning mock trading pairs data');
      return new Response(JSON.stringify(mockData.tradingPairs), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // For any other API request, return a generic success response
    console.log('[Exchange Mock] Returning generic success response for API request');
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
  return originalFetch(input, init);
};

// Also override the makeApiRequest function if it exists
if (window.makeApiRequest) {
  const originalMakeApiRequest = window.makeApiRequest;
  window.makeApiRequest = async function(exchangeId, url, options) {
    console.log(`[Exchange Mock] Intercepted makeApiRequest: ${url}`);
    // Return mock data based on the URL
    // This is similar to the fetch interception above
    return mockData.portfolio; // Default to portfolio data
  };
}

console.log('Exchange Adapter Mock initialized. All exchange API requests will be intercepted.');
