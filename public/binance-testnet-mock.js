/**
 * Binance Testnet Mock
 * 
 * This script specifically intercepts Binance Testnet API requests
 * and provides mock responses. It's designed to work with the
 * BinanceTestnetAdapter in the showcase version.
 */

console.log('Initializing Binance Testnet Mock...');

// Check if we're in showcase mode
const isShowcase = window.location.hostname.includes('github.io') || 
                  window.location.pathname.includes('/omnitrade-terminal/');

if (isShowcase) {
  // Store a reference to the original fetch function
  const originalFetch = window.fetch;
  
  // Override the fetch function to intercept Binance Testnet API requests
  window.fetch = async function(input, init) {
    const url = typeof input === 'string' 
      ? input 
      : input instanceof URL 
        ? input.toString() 
        : input.url;
    
    // Check if this is a Binance Testnet API request
    if (url.includes('/api/proxy/binance-testnet') || 
        url.includes('testnet.binance.vision')) {
      console.log(`[Binance Testnet Mock] Intercepted request: ${url}`);
      
      // Extract the endpoint from the URL
      const endpoint = url.split('/api/v3/')[1]?.split('?')[0] || '';
      console.log(`[Binance Testnet Mock] Endpoint: ${endpoint}`);
      
      // Return different mock responses based on the endpoint
      switch (endpoint) {
        case 'ping':
          return new Response(JSON.stringify({}), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        case 'exchangeInfo':
          return new Response(JSON.stringify({
            timezone: 'UTC',
            serverTime: Date.now(),
            rateLimits: [],
            exchangeFilters: [],
            symbols: [
              {
                symbol: 'BTCUSDT',
                status: 'TRADING',
                baseAsset: 'BTC',
                baseAssetPrecision: 8,
                quoteAsset: 'USDT',
                quotePrecision: 8,
                quoteAssetPrecision: 8,
                orderTypes: ['LIMIT', 'MARKET'],
                icebergAllowed: true,
                ocoAllowed: true,
                isSpotTradingAllowed: true,
                isMarginTradingAllowed: false,
                filters: [],
                permissions: ['SPOT']
              },
              {
                symbol: 'ETHUSDT',
                status: 'TRADING',
                baseAsset: 'ETH',
                baseAssetPrecision: 8,
                quoteAsset: 'USDT',
                quotePrecision: 8,
                quoteAssetPrecision: 8,
                orderTypes: ['LIMIT', 'MARKET'],
                icebergAllowed: true,
                ocoAllowed: true,
                isSpotTradingAllowed: true,
                isMarginTradingAllowed: false,
                filters: [],
                permissions: ['SPOT']
              }
            ]
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        case 'depth':
          return new Response(JSON.stringify({
            lastUpdateId: 1027024,
            bids: Array.from({ length: 20 }, (_, i) => [
              (65000 - i * 10).toString(), 
              (Math.random() * 2).toString()
            ]),
            asks: Array.from({ length: 20 }, (_, i) => [
              (65000 + i * 10).toString(), 
              (Math.random() * 2).toString()
            ])
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        case 'trades':
          return new Response(JSON.stringify(
            Array.from({ length: 50 }, (_, i) => ({
              id: 28457,
              price: (65000 + (Math.random() * 1000 - 500)).toString(),
              qty: (Math.random() * 2).toString(),
              time: Date.now() - i * 60000,
              isBuyerMaker: Math.random() > 0.5,
              isBestMatch: true
            }))
          ), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        case 'klines':
          return new Response(JSON.stringify(
            Array.from({ length: 100 }, (_, i) => {
              const time = Date.now() - (99 - i) * 60000;
              const open = 65000 + Math.random() * 1000 - 500;
              const high = open + Math.random() * 200;
              const low = open - Math.random() * 200;
              const close = open + Math.random() * 400 - 200;
              const volume = Math.random() * 10;
              
              return [
                time, // Open time
                open.toString(), // Open
                high.toString(), // High
                low.toString(), // Low
                close.toString(), // Close
                volume.toString(), // Volume
                time + 60000, // Close time
                (volume * close).toString(), // Quote asset volume
                100, // Number of trades
                (volume * 0.5).toString(), // Taker buy base asset volume
                (volume * 0.5 * close).toString(), // Taker buy quote asset volume
                "0" // Ignore
              ];
            })
          ), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        case 'ticker/24hr':
          return new Response(JSON.stringify({
            symbol: 'BTCUSDT',
            priceChange: '1200.00',
            priceChangePercent: '1.80',
            weightedAvgPrice: '64500.00',
            prevClosePrice: '63800.00',
            lastPrice: '65000.00',
            lastQty: '0.5',
            bidPrice: '64990.00',
            bidQty: '1.0',
            askPrice: '65010.00',
            askQty: '1.0',
            openPrice: '63800.00',
            highPrice: '65500.00',
            lowPrice: '63500.00',
            volume: '1000.0',
            quoteVolume: '65000000.0',
            openTime: Date.now() - 24 * 60 * 60 * 1000,
            closeTime: Date.now(),
            firstId: 100000,
            lastId: 150000,
            count: 50000
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        default:
          // For any other Binance Testnet endpoint, return a generic success response
          return new Response(JSON.stringify({
            success: true,
            message: 'Mock Binance Testnet response',
            data: {}
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
      }
    }
    
    // For non-Binance Testnet requests, use the original fetch
    return originalFetch(input, init);
  };
  
  console.log('Binance Testnet Mock initialized. All Binance Testnet API requests will be intercepted.');
}
