/**
 * Handler for klines (candlestick) requests
 */

import { parseUrl, constructBinanceTestnetUrl, createJsonResponse } from '../utils/apiUtils';
import { getCachedData, cacheData, CACHE_TIMES } from '../utils/cacheUtils';
import { createMockKlines } from '../utils/mockDataFactory';
import { fetchWithTimeout } from '../utils/apiUtils';
import { isBinanceTestnetEnabled, formatSymbol } from './commonHandlers';

/**
 * Handle klines (candlestick) requests
 * @param url The request URL
 * @returns A Response object
 */
export async function handleKlinesRequest(url: string): Promise<Response> {
  const { params, endpoint } = parseUrl(url);
  const symbol = formatSymbol(params.symbol);
  const interval = params.interval || '1h';
  const limit = parseInt(params.limit || '100');
  
  console.log(`Handling klines request for ${symbol} with interval ${interval} and limit ${limit}`);
  
  // Always use mock data if Binance Testnet is disabled
  if (!isBinanceTestnetEnabled()) {
    console.log(`Using mock data for klines (Binance Testnet disabled)`);
    return createJsonResponse(createMockKlines(symbol, interval, limit));
  }
  
  // Check if we have cached data
  const cacheKey = `binance_testnet_klines_${symbol}_${interval}_${limit}`;
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) {
    return createJsonResponse(JSON.parse(cachedData));
  }
  
  try {
    console.log('Fetching klines data from Binance Testnet API');
    
    const binanceUrl = constructBinanceTestnetUrl(endpoint, {
      symbol,
      interval,
      limit: limit.toString()
    });
    
    const response = await fetchWithTimeout(binanceUrl);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    // Get the response data
    const data = await response.text();
    
    // Cache the response
    cacheData(cacheKey, data, CACHE_TIMES.KLINES);
    
    return createJsonResponse(JSON.parse(data));
  } catch (error) {
    console.error('Error fetching klines data from Binance Testnet API:', error);
    
    // Fall back to mock data
    console.warn('Falling back to mock klines data');
    return createJsonResponse(createMockKlines(symbol, interval, limit));
  }
}
