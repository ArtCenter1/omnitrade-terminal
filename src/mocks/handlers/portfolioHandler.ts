/**
 * Handler for portfolio requests
 */

import { createJsonResponse } from '../utils/apiUtils';
import { getMockPortfolioData } from '../mockPortfolio';

/**
 * Handle portfolio requests
 * @param url The request URL
 * @returns A Response object
 */
export function handlePortfolioRequest(url: string): Response {
  console.log('Handling portfolio request');
  
  const mockData = getMockPortfolioData();
  return createJsonResponse(mockData);
}
