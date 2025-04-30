/**
 * Handler for health check requests
 */

import { createJsonResponse } from '../utils/apiUtils';
import { createMockHealthCheck } from '../utils/mockDataFactory';

/**
 * Handle health check requests
 * @returns A Response object
 */
export function handleHealthRequest(): Response {
  console.log('Handling health check request');
  
  return createJsonResponse(createMockHealthCheck());
}
