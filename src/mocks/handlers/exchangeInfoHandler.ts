/**
 * Handler for exchangeInfo requests
 */

import { createJsonResponse } from '../utils/apiUtils';
import { getCachedData, cacheData, CACHE_TIMES } from '../utils/cacheUtils';
import { createMockExchangeInfo } from '../utils/mockDataFactory';
import { fetchWithTimeout } from '../utils/apiUtils';
import { isBinanceTestnetEnabled } from './commonHandlers';

/**
 * Handle exchangeInfo requests
 * @param url The request URL
 * @returns A Response object
 */
export async function handleExchangeInfoRequest(url: string): Promise<Response> {
  console.log('Handling exchangeInfo request with dedicated handler');
  
  // Always use mock data if Binance Testnet is disabled
  if (!isBinanceTestnetEnabled()) {
    console.log('Using mock data for exchangeInfo (Binance Testnet disabled)');
    return createJsonResponse(createMockExchangeInfo());
  }
  
  // Check if we have cached data
  const cacheKey = 'binance_testnet_exchangeInfo';
  const cachedData = getCachedData(cacheKey);
  
  if (cachedData) {
    return createJsonResponse(JSON.parse(cachedData));
  }
  
  try {
    console.log('Fetching exchangeInfo from Binance Testnet API');
    
    const response = await fetchWithTimeout(
      'https://testnet.binance.vision/api/v3/exchangeInfo'
    );
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    // Get the response data
    const data = await response.text();
    
    // Cache the response
    cacheData(cacheKey, data, CACHE_TIMES.EXCHANGE_INFO);
    
    return createJsonResponse(JSON.parse(data));
  } catch (error) {
    console.error('Error fetching exchangeInfo from Binance Testnet API:', error);
    
    // Fall back to mock data
    console.warn('Falling back to mock exchangeInfo data');
    return createJsonResponse(createMockExchangeInfo());
  }
}
