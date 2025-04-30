/**
 * Handler for ticker requests
 */

import { parseUrl, constructBinanceTestnetUrl, createJsonResponse } from '../utils/apiUtils';
import { getCachedData, cacheData, CACHE_TIMES } from '../utils/cacheUtils';
import { createMockTickerStats } from '../utils/mockDataFactory';
import { fetchWithTimeout } from '../utils/apiUtils';
import { isBinanceTestnetEnabled, formatSymbol } from './commonHandlers';

/**
 * Handle ticker requests
 * @param url The request URL
 * @returns A Response object
 */
export async function handleTickerRequest(url: string): Promise<Response> {
  const { params, endpoint } = parseUrl(url);
  const symbol = formatSymbol(params.symbol);
  
  console.log(`Handling ticker request for ${symbol}`);
  
  // Always use mock data if Binance Testnet is disabled
  if (!isBinanceTestnetEnabled()) {
    console.log(`Using mock data for ticker (Binance Testnet disabled)`);
    return createJsonResponse(createMockTickerStats(symbol));
  }
  
  // Check if we have cached data
  const cacheKey = `binance_testnet_ticker_${symbol}`;
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) {
    return createJsonResponse(JSON.parse(cachedData));
  }
  
  try {
    console.log('Fetching ticker data from Binance Testnet API');
    
    const binanceUrl = constructBinanceTestnetUrl(endpoint, {
      symbol
    });
    
    const response = await fetchWithTimeout(binanceUrl);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    // Get the response data
    const data = await response.text();
    
    // Cache the response
    cacheData(cacheKey, data, CACHE_TIMES.TICKER);
    
    return createJsonResponse(JSON.parse(data));
  } catch (error) {
    console.error('Error fetching ticker data from Binance Testnet API:', error);
    
    // Fall back to mock data
    console.warn('Falling back to mock ticker data');
    return createJsonResponse(createMockTickerStats(symbol));
  }
}
