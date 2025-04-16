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
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }
  const token = await user.getIdToken();

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
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // Add Authorization header
    },
    body: JSON.stringify(dto),
    // credentials: "include", // Remove or keep based on whether cookies are still needed alongside token auth
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
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }
  const token = await user.getIdToken();

  const response = await fetch(`/api/exchange-api-keys/${apiKeyId}/test`, {
    method: 'POST',
    headers: {
      // "Content-Type": "application/json", // Keep commented or remove if not needed
      Authorization: `Bearer ${token}`, // Add Authorization header
    },
    // No body needed for this specific test endpoint
    // credentials: "include", // Remove or keep based on whether cookies are still needed alongside token auth
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
  // Type assertion might be needed if the Promise<any> is enforced elsewhere,
  // but defining the return type as Promise<TestApiKeyResponse> is better.
  return data as TestApiKeyResponse;
}

/**
 * List all exchange API keys for the current user
 */
export async function listExchangeApiKeys(): Promise<ExchangeApiKey[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }
  const token = await user.getIdToken();

  const response = await fetch('/api/exchange-api-keys', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to list exchange API keys');
  }

  return response.json();
}

/**
 * Delete an exchange API key
 */
export async function deleteExchangeApiKey(
  apiKeyId: string,
): Promise<{ message: string }> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated.');
  }
  const token = await user.getIdToken();

  const response = await fetch(`/api/exchange-api-keys/${apiKeyId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete exchange API key');
  }

  return response.json();
}
