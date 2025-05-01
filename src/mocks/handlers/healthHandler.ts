/**
 * Handler for health check requests
 */

import { createJsonResponse } from '../utils/apiUtils';
import { createMockHealthCheck } from '../utils/mockDataFactory';
import { getFeatureFlags } from '@/config/featureFlags.tsx';

/**
 * Handle health check requests
 * @returns A Response object
 */
export function handleHealthRequest(): Response {
  // Add more detailed logging to help debug health check issues
  const flags = getFeatureFlags();
  console.log('Handling health check request', {
    useMockData: flags.useMockData,
    connectionMode: flags.connectionMode,
    useBinanceTestnet: flags.useBinanceTestnet,
  });

  // Create a mock health check response
  const healthData = createMockHealthCheck();

  return createJsonResponse(healthData);
}
