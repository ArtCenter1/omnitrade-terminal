import { getAuth } from 'firebase/auth';
import { app } from '@/integrations/firebase/client';
import { ExchangeFactory } from './exchange/exchangeFactory';

const auth = getAuth(app);

export interface CreateExchangeApiKeyDto {
  exchange_id: string;
  api_key: string;
  api_secret: string;
  key_nickname?: string;
}

export interface ExchangeApiKey {
  api_key_id: string;
  exchange_id: string;
  key_nickname?: string;
  created_at: string;
  updated_at: string;
  is_valid?: boolean;
}

export interface TestApiKeyResponse {
  success: boolean;
  message: string;
}

/**
 * Add a new exchange API key
 */
export async function addExchangeApiKey(
  dto: CreateExchangeApiKeyDto,
): Promise<ExchangeApiKey> {
  // In development mode, bypass authentication
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // In production, add authentication
  if (import.meta.env.PROD) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  // First, validate the API key with the exchange
  try {
    const adapter = ExchangeFactory.getAdapter(dto.exchange_id);
    const isValid = await adapter.validateApiKey(dto.api_key, dto.api_secret);

    if (!isValid) {
      throw new Error('Invalid API key or secret.');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Validation failed: ${error.message}`);
    }
    throw new Error('Failed to validate API key with exchange.');
  }

  // Then, send to backend to store
  const response = await fetch('/api/exchange-api-keys', {
    method: 'POST',
    headers,
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to add exchange API key');
  }
  return response.json();
}

/**
 * Test an existing API key
 */
export async function testExchangeApiKey(
  apiKeyId: string,
): Promise<TestApiKeyResponse> {
  // In development mode, bypass authentication
  let headers: Record<string, string> = {};

  // In production, add authentication
  if (import.meta.env.PROD) {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }
    const token = await user.getIdToken();
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api/exchange-api-keys/${apiKeyId}/test`, {
    method: 'POST',
    headers,
  });

  const data = await response.json().catch(() => ({})); // Attempt to parse JSON, default to empty object on failure

  if (!response.ok) {
    // Use message from response body if available, otherwise provide a default
    throw new Error(
      data.message ||
        `Failed to test API key (ID: ${apiKeyId}). Status: ${response.status}`,
    );
  }

  // Assuming the backend returns { success: boolean, message: string }
  return data as TestApiKeyResponse;
}

/**
 * List all exchange API keys for the current user
 */
export async function listExchangeApiKeys(): Promise<ExchangeApiKey[]> {
  try {
    // In development mode, bypass authentication
    let headers: Record<string, string> = {};

    // In production, add authentication
    if (import.meta.env.PROD) {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated.');
      }
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log('Fetching exchange API keys...');

    // Use a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch('/api/exchange-api-keys', {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(
          errorData.message ||
            `Failed to list exchange API keys: ${response.status}`,
        );
      }

      const data = await response.json();
      console.log('Fetched exchange API keys:', data);
      return data;
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 10 seconds');
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error in listExchangeApiKeys:', error);
    throw error;
  }
}

/**
 * Delete an exchange API key
 */
export async function deleteExchangeApiKey(
  apiKeyId: string,
): Promise<{ message: string }> {
  try {
    // In development mode, bypass authentication
    let headers: Record<string, string> = {};

    // In production, add authentication
    if (import.meta.env.PROD) {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated.');
      }
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`Deleting exchange API key: ${apiKeyId}`);

    // Use a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`/api/exchange-api-keys/${apiKeyId}`, {
        method: 'DELETE',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(
          errorData.message || 'Failed to delete exchange API key',
        );
      }

      const data = await response.json();
      console.log('Delete response:', data);
      return data;
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error('Request timed out after 10 seconds');
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error in deleteExchangeApiKey:', error);
    throw error;
  }
}
