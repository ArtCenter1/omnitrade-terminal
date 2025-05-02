// src/utils/apiUtils.ts
import { ConnectionManager } from '@/services/connection/connectionManager';
import { RateLimitManager } from '@/services/connection/rateLimitManager';

/**
 * Options for API requests
 */
export interface ApiRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  weight?: number;
  parseJson?: boolean;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
  forceRest?: boolean;
  isWebSocketAvailable?: boolean;
  webSocketFallbackFn?: () => Promise<any>;
}

/**
 * Make an API request with rate limit handling
 * @param exchangeId The exchange ID
 * @param url The URL to request
 * @param options The request options
 * @returns The response data
 */
export async function makeApiRequest<T>(
  exchangeId: string,
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    headers = {},
    body,
    weight = 1,
    parseJson = true,
    retries = 3,
    retryDelay = 1000,
    timeout = 30000,
    forceRest = false,
    isWebSocketAvailable = false,
    webSocketFallbackFn = undefined,
  } = options;

  const connectionManager = ConnectionManager.getInstance();
  const rateLimitManager = RateLimitManager.getInstance();

  // Check if we should use WebSocket instead of REST API
  if (
    !forceRest &&
    isWebSocketAvailable &&
    webSocketFallbackFn &&
    rateLimitManager.getPreferWebSocket()
  ) {
    console.log(
      `[${exchangeId}] Using WebSocket instead of REST API for request to ${url}`,
    );

    try {
      // Update connection status to connecting via WebSocket
      connectionManager.setStatus(exchangeId, {
        status: 'connecting',
        message: `Using WebSocket instead of REST API for ${url}`,
      });

      // Get data from WebSocket
      const result = await webSocketFallbackFn();

      // Update connection status to connected
      connectionManager.setStatus(exchangeId, {
        status: 'connected',
        message: `Successfully received data from WebSocket for ${url}`,
        // Include rate limit info in the status
        rateLimit: rateLimitManager.getRateLimitInfo(exchangeId),
      });

      return result;
    } catch (wsError) {
      console.warn(
        `[${exchangeId}] WebSocket fallback failed, falling back to REST API:`,
        wsError,
      );
      // Fall through to REST API
    }
  }

  // Update connection status to connecting
  connectionManager.setStatus(exchangeId, {
    status: 'connecting',
    message: `Making ${method} request to ${url}`,
  });

  // Create request function
  const requestFn = async () => {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Prepare request options
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      };

      // Add body if provided
      if (body) {
        requestOptions.body =
          typeof body === 'string' ? body : JSON.stringify(body);
      }

      // Make the request
      const startTime = Date.now();
      const response = await fetch(url, requestOptions);
      const endTime = Date.now();

      // Update connection status with latency
      connectionManager.setStatus(exchangeId, {
        latency: endTime - startTime,
      });

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  try {
    // Execute the request with rate limit handling
    const result = await rateLimitManager.executeRequest<T>(
      exchangeId,
      requestFn,
      weight,
      { parseJson, retries, retryDelay },
    );

    // Update connection status to connected
    connectionManager.setStatus(exchangeId, {
      status: 'connected',
      message: `Successfully completed ${method} request to ${url}`,
      // Include rate limit info in the status
      rateLimit: rateLimitManager.getRateLimitInfo(exchangeId),
    });

    return result;
  } catch (error) {
    // Update connection status to error
    connectionManager.setStatus(exchangeId, {
      status: 'error',
      error: error instanceof Error ? error : new Error(String(error)),
      message: `Error making ${method} request to ${url}: ${error instanceof Error ? error.message : String(error)}`,
      // Include rate limit info in the status
      rateLimit: rateLimitManager.getRateLimitInfo(exchangeId),
    });

    throw error;
  }
}
