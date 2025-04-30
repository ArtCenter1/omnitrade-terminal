/**
 * Utility functions for API requests and responses
 */

/**
 * Create a successful JSON response
 * @param data The data to include in the response
 * @param status The HTTP status code (default: 200)
 * @returns A Response object
 */
export function createJsonResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Create an error JSON response
 * @param message The error message
 * @param status The HTTP status code (default: 404)
 * @returns A Response object
 */
export function createErrorResponse(message: string, status: number = 404): Response {
  return new Response(
    JSON.stringify({ message }),
    {
      status,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Make a fetch request with timeout
 * @param url The URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds
 * @returns A Promise that resolves to a Response
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await window.originalFetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Extract path and parameters from a URL
 * @param url The URL to parse
 * @returns An object containing the path and parameters
 */
export function parseUrl(url: string): { 
  path: string; 
  params: Record<string, string>;
  endpoint: string;
} {
  const urlObj = new URL(url, window.location.origin);
  const path = urlObj.pathname;
  const params = Object.fromEntries(urlObj.searchParams.entries());
  
  // Extract the endpoint from the URL (remove /api/mock/binance_testnet)
  const endpoint = path.replace('/api/mock/binance_testnet', '');
  
  return { path, params, endpoint };
}

/**
 * Construct a Binance Testnet API URL
 * @param endpoint The API endpoint
 * @param params The query parameters
 * @returns The full URL
 */
export function constructBinanceTestnetUrl(
  endpoint: string, 
  params: Record<string, string>
): string {
  // Make sure the endpoint starts with a slash
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Convert params to URLSearchParams
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    searchParams.append(key, value);
  }
  
  // Construct the URL
  return `https://testnet.binance.vision/api${formattedEndpoint}${
    searchParams.toString() ? '?' + searchParams.toString() : ''
  }`;
}
