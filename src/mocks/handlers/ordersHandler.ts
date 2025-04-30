/**
 * Handler for orders requests
 */

import { createJsonResponse } from '../utils/apiUtils';
import { getMockDataService } from '../utils/mockDataFactory';

/**
 * Handle orders requests
 * @param url The request URL
 * @param init Request init options
 * @returns A Response object
 */
export function handleOrdersRequest(url: string, init?: RequestInit): Response {
  if (init?.method === 'POST') {
    return handleCreateOrder(url, init);
  } else {
    return handleGetOrders(url);
  }
}

/**
 * Handle order creation
 * @param url The request URL
 * @param init Request init options
 * @returns A Response object
 */
function handleCreateOrder(url: string, init: RequestInit): Response {
  // Mock order creation
  const body = init.body ? JSON.parse(init.body.toString()) : {};
  const newOrder = {
    orderId: `mock-${Date.now()}`,
    symbol: body.symbol,
    side: body.side,
    type: body.type,
    quantity: body.quantity,
    price: body.price,
    status: 'NEW',
    timestamp: Date.now(),
  };
  
  console.log('Creating mock order:', newOrder);
  
  return createJsonResponse(newOrder, 201);
}

/**
 * Handle get orders
 * @param url The request URL
 * @returns A Response object
 */
function handleGetOrders(url: string): Response {
  // Mock fetching orders
  const mockDataService = getMockDataService();
  const mockData = mockDataService.generateOrders(
    'mock',
    'mock',
    'BTCUSDT',
    10
  );
  
  console.log('Fetching mock orders');
  
  return createJsonResponse(mockData);
}
