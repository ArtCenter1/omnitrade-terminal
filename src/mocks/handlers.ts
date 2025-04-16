// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

// Mock data for exchange API keys
let mockApiKeys = [
  // You can add some initial mock data here if needed
  {
    api_key_id: 'mock-key-1',
    exchange_id: 'binance',
    key_nickname: 'My Binance Account',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_valid: true,
  },
];

// Generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 15);

export const handlers = [
  // List API keys
  http.get('/api/exchange-api-keys', async () => {
    // Simulate a delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return HttpResponse.json(mockApiKeys, { status: 200 });
  }),

  // Add API key
  http.post('/api/exchange-api-keys', async ({ request }) => {
    const body = await request.json();

    // Validate required fields
    if (!body.exchange_id || !body.api_key || !body.api_secret) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return HttpResponse.json(
        { message: 'Missing required fields' },
        { status: 400 },
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

    // Return success
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return HttpResponse.json(newApiKey, { status: 201 });
  }),

  // Test API key
  http.post('/api/exchange-api-keys/:id/test', async ({ params }) => {
    const { id } = params;

    // Find API key
    const apiKey = mockApiKeys.find((key) => key.api_key_id === id);

    if (!apiKey) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return HttpResponse.json(
        { message: 'API key not found' },
        { status: 404 },
      );
    }

    // Simulate successful test (90% success rate)
    const isSuccess = Math.random() < 0.9;

    if (isSuccess) {
      // Update API key status
      apiKey.is_valid = true;
      apiKey.updated_at = new Date().toISOString();

      await new Promise((resolve) => setTimeout(resolve, 2000));
      return HttpResponse.json(
        { success: true, message: 'API key is valid' },
        { status: 200 },
      );
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return HttpResponse.json(
        {
          success: false,
          message: 'API key is invalid or has insufficient permissions',
        },
        { status: 200 },
      );
    }
  }),

  // Delete API key
  http.delete('/api/exchange-api-keys/:id', async ({ params }) => {
    const { id } = params;

    // Find API key
    const apiKeyIndex = mockApiKeys.findIndex((key) => key.api_key_id === id);

    if (apiKeyIndex === -1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return HttpResponse.json(
        { message: 'API key not found' },
        { status: 404 },
      );
    }

    // Remove API key
    mockApiKeys.splice(apiKeyIndex, 1);

    await new Promise((resolve) => setTimeout(resolve, 1200));
    return HttpResponse.json(
      { message: 'API key deleted successfully' },
      { status: 200 },
    );
  }),
];
