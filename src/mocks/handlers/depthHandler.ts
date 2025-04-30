/**
 * Handler for depth (order book) requests
 */

import { parseUrl, constructBinanceTestnetUrl, createJsonResponse } from '../utils/apiUtils';
import { getCachedData, cacheData, CACHE_TIMES } from '../utils/cacheUtils';
import { createMockOrderBook } from '../utils/mockDataFactory';
import { fetchWithTimeout } from '../utils/apiUtils';
import { isBinanceTestnetEnabled, formatSymbol } from './commonHandlers';

/**
 * Handle depth (order book) requests
 * @param url The request URL
 * @returns A Response object
 */
export async function handleDepthRequest(url: string): Promise<Response> {
  const { params, endpoint } = parseUrl(url);
  const symbol = formatSymbol(params.symbol);
  const limit = parseInt(params.limit || '20');
  
  console.log(`Handling depth request for ${symbol} with limit ${limit}`);
  
  // Always use mock data if Binance Testnet is disabled
  if (!isBinanceTestnetEnabled()) {
    console.log(`Using mock data for depth (Binance Testnet disabled)`);
    return createJsonResponse(createMockOrderBook(symbol, limit));
  }
  
  // Check if we have cached data
  const cacheKey = `binance_testnet_depth_${symbol}_${limit}`;
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) {
    return createJsonResponse(JSON.parse(cachedData));
  }
  
  try {
    console.log('Fetching depth data from Binance Testnet API');
    
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
    
    // Cache the response (short cache time for order book data)
    cacheData(cacheKey, data, CACHE_TIMES.DEPTH);
    
    return createJsonResponse(JSON.parse(data));
  } catch (error) {
    console.error('Error fetching depth data from Binance Testnet API:', error);
    
    // Fall back to mock data
    console.warn('Falling back to mock depth data');
    return createJsonResponse(createMockOrderBook(symbol, limit));
  }
}
