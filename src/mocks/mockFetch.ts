// src/mocks/mockFetch.ts
// A simpler approach to mocking API calls by directly overriding fetch

// Mock data for exchange API keys
let mockApiKeys = [
  {
    api_key_id: 'mock-key-1',
    exchange_id: 'binance',
    key_nickname: 'My Binance Account',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_valid: true,
  },
];

// Try to load saved API keys from localStorage
try {
  const savedKeys = localStorage.getItem('exchange_api_keys');
  if (savedKeys) {
    const parsedKeys = JSON.parse(savedKeys);
    if (Array.isArray(parsedKeys) && parsedKeys.length > 0) {
      mockApiKeys = parsedKeys;
    }
  }
} catch (error) {
  console.error('Error loading saved API keys:', error);
}

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

// Setup mock fetch
export function setupMockFetch() {
  const originalFetch = window.fetch;

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;
    console.log(`Mock fetch intercepted: ${url}`);

    // Handle exchange API endpoints
    if (url.includes('/api/exchange-api-keys')) {
      // List API keys
      if (
        url === '/api/exchange-api-keys' &&
        (!init || init.method === 'GET')
      ) {
        console.log('Mocking GET /api/exchange-api-keys');
        await new Promise((resolve) => setTimeout(resolve, 500)); // Add delay
        return new Response(JSON.stringify(mockApiKeys), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Add API key
      if (url === '/api/exchange-api-keys' && init?.method === 'POST') {
        console.log('Mocking POST /api/exchange-api-keys');
        const body = init.body ? JSON.parse(init.body.toString()) : {};

        // Validate required fields
        if (!body.exchange_id || !body.api_key || !body.api_secret) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          return new Response(
            JSON.stringify({ message: 'Missing required fields' }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        // Create new API key
        const newApiKey = {
          api_key_id: generateId(),
          exchange_id: body.exchange_id,
          key_nickname: body.key_nickname || body.exchange_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_valid: true,
        };

        // Add to mock data
        mockApiKeys.push(newApiKey);

        // Save to localStorage
        try {
          localStorage.setItem(
            'exchange_api_keys',
            JSON.stringify(mockApiKeys),
          );
        } catch (error) {
          console.error('Error saving API keys to localStorage:', error);
        }

        await new Promise((resolve) => setTimeout(resolve, 800));
        return new Response(JSON.stringify(newApiKey), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Test API key
      if (
        url.match(/\/api\/exchange-api-keys\/.*\/test/) &&
        init?.method === 'POST'
      ) {
        console.log('Mocking POST /api/exchange-api-keys/:id/test');
        const id = url.split('/')[3];
        const apiKey = mockApiKeys.find((key) => key.api_key_id === id);

        if (!apiKey) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          return new Response(
            JSON.stringify({ message: 'API key not found' }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        // Simulate successful test (90% success rate)
        const isSuccess = Math.random() < 0.9;

        if (isSuccess) {
          // Update API key status
          apiKey.is_valid = true;
          apiKey.updated_at = new Date().toISOString();

          await new Promise((resolve) => setTimeout(resolve, 1000));
          return new Response(
            JSON.stringify({ success: true, message: 'API key is valid' }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        } else {
          await new Promise((resolve) => setTimeout(resolve, 800));
          return new Response(
            JSON.stringify({
              success: false,
              message: 'API key is invalid or has insufficient permissions',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
      }

      // Delete API key
      if (
        url.match(/\/api\/exchange-api-keys\/.*/) &&
        init?.method === 'DELETE'
      ) {
        console.log('Mocking DELETE /api/exchange-api-keys/:id');
        const id = url.split('/')[3];
        const apiKeyIndex = mockApiKeys.findIndex(
          (key) => key.api_key_id === id,
        );

        if (apiKeyIndex === -1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          return new Response(
            JSON.stringify({ message: 'API key not found' }),
            {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }

        // Remove API key
        mockApiKeys.splice(apiKeyIndex, 1);

        // Save to localStorage
        try {
          localStorage.setItem(
            'exchange_api_keys',
            JSON.stringify(mockApiKeys),
          );
        } catch (error) {
          console.error('Error saving API keys to localStorage:', error);
        }

        await new Promise((resolve) => setTimeout(resolve, 600));
        return new Response(
          JSON.stringify({ message: 'API key deleted successfully' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
    }

    // Pass through to original fetch for all other requests
    return originalFetch(input, init);
  };

  console.log('Mock fetch setup complete');
}
