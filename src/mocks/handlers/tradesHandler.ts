/**
 * Handler for trades requests
 */

import { parseUrl, constructBinanceTestnetUrl, createJsonResponse } from '../utils/apiUtils';
import { getCachedData, cacheData, CACHE_TIMES } from '../utils/cacheUtils';
import { createMockTrades } from '../utils/mockDataFactory';
import { fetchWithTimeout } from '../utils/apiUtils';
import { isBinanceTestnetEnabled, formatSymbol } from './commonHandlers';

/**
 * Handle trades requests
 * @param url The request URL
 * @returns A Response object
 */
export async function handleTradesRequest(url: string): Promise<Response> {
  const { params, endpoint } = parseUrl(url);
  const symbol = formatSymbol(params.symbol);
  const limit = parseInt(params.limit || '50');
  
  console.log(`Handling trades request for ${symbol} with limit ${limit}`);
  
  // Always use mock data if Binance Testnet is disabled
  if (!isBinanceTestnetEnabled()) {
    console.log(`Using mock data for trades (Binance Testnet disabled)`);
    return createJsonResponse(createMockTrades(symbol, limit));
  }
  
  // Check if we have cached data
  const cacheKey = `binance_testnet_trades_${symbol}_${limit}`;
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) {
    return createJsonResponse(JSON.parse(cachedData));
  }
  
  try {
    console.log('Fetching trades data from Binance Testnet API');
    
    const binanceUrl = constructBinanceTestnetUrl(endpoint, {
      symbol,
      limit: limit.toString()
    });
    
    const response = await fetchWithTimeout(binanceUrl);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    // Get the response data
    const data = await response.text();
    
    // Cache the response
    cacheData(cacheKey, data, CACHE_TIMES.TRADES);
    
    return createJsonResponse(JSON.parse(data));
  } catch (error) {
    console.error('Error fetching trades data from Binance Testnet API:', error);
    
    // Fall back to mock data
    console.warn('Falling back to mock trades data');
    return createJsonResponse(createMockTrades(symbol, limit));
  }
}
