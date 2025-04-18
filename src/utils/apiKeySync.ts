// src/utils/apiKeySync.ts
import { DEFAULT_MOCK_ACCOUNTS } from '@/mocks/mockExchangeAccounts';

// Event name for API key updates
export const API_KEY_UPDATED_EVENT = 'apiKeyUpdated';

/**
 * Dispatch an event when API keys are updated
 * @param apiKeyId The ID of the updated API key
 * @param nickname The new nickname for the API key
 */
export function dispatchApiKeyUpdated(apiKeyId: string, nickname: string) {
  console.log(`Dispatching API key updated event for ${apiKeyId}: ${nickname}`);

  // Create and dispatch a custom event
  const event = new CustomEvent(API_KEY_UPDATED_EVENT, {
    detail: { apiKeyId, nickname },
  });

  window.dispatchEvent(event);

  // Also update localStorage directly for immediate effect
  updateApiKeyInLocalStorage(apiKeyId, nickname);
}

/**
 * Update an API key nickname in localStorage
 * @param apiKeyId The ID of the API key to update
 * @param nickname The new nickname for the API key
 */
export function updateApiKeyInLocalStorage(apiKeyId: string, nickname: string) {
  try {
    // Get existing API keys from localStorage
    const savedKeysStr = localStorage.getItem('exchange_api_keys');
    if (savedKeysStr) {
      const savedKeys = JSON.parse(savedKeysStr);

      // Find and update the API key
      const keyIndex = savedKeys.findIndex(
        (key: any) => key.api_key_id === apiKeyId,
      );
      if (keyIndex >= 0) {
        // Update the nickname
        savedKeys[keyIndex].key_nickname = nickname;
        localStorage.setItem('exchange_api_keys', JSON.stringify(savedKeys));
        console.log(
          `Updated API key ${apiKeyId} nickname to ${nickname} in localStorage`,
        );
      } else {
        // Key not found, add it
        const exchangeId = getExchangeIdForApiKey(apiKeyId);
        savedKeys.push({
          api_key_id: apiKeyId,
          exchange_id: exchangeId,
          key_nickname: nickname,
        });
        localStorage.setItem('exchange_api_keys', JSON.stringify(savedKeys));
        console.log(
          `Added API key ${apiKeyId} with nickname ${nickname} to localStorage`,
        );
      }
    } else {
      // No existing keys, create a new array
      const exchangeId = getExchangeIdForApiKey(apiKeyId);
      const newKeys = [
        {
          api_key_id: apiKeyId,
          exchange_id: exchangeId,
          key_nickname: nickname,
        },
      ];
      localStorage.setItem('exchange_api_keys', JSON.stringify(newKeys));
      console.log(
        `Created new API keys array in localStorage with ${apiKeyId}: ${nickname}`,
      );
    }

    // Also update the DEFAULT_MOCK_ACCOUNTS directly for immediate effect
    updateDefaultMockAccounts(apiKeyId, nickname);
  } catch (error) {
    console.error('Error updating API key in localStorage:', error);
  }
}

/**
 * Update the DEFAULT_MOCK_ACCOUNTS with a new nickname
 * @param apiKeyId The ID of the API key to update
 * @param nickname The new nickname for the API key
 */
function updateDefaultMockAccounts(apiKeyId: string, nickname: string) {
  try {
    // Find the account in DEFAULT_MOCK_ACCOUNTS
    const account = DEFAULT_MOCK_ACCOUNTS.find(
      (acc) => acc.apiKeyId === apiKeyId,
    );
    if (account) {
      console.log(
        `Updating DEFAULT_MOCK_ACCOUNTS nickname for ${apiKeyId}: ${nickname}`,
      );
      account.name = nickname;
    }
  } catch (error) {
    console.error('Error updating DEFAULT_MOCK_ACCOUNTS:', error);
  }
}

/**
 * Get the exchange ID for an API key based on the mock accounts
 * @param apiKeyId The API key ID
 * @returns The exchange ID for the API key
 */
function getExchangeIdForApiKey(apiKeyId: string): string {
  // Try to find the exchange ID in DEFAULT_MOCK_ACCOUNTS
  const account = DEFAULT_MOCK_ACCOUNTS.find(
    (acc) => acc.apiKeyId === apiKeyId,
  );
  if (account) {
    return account.exchangeId;
  }

  // Default to 'binance' if not found
  return 'binance';
}

/**
 * Initialize the API key sync system
 * This should be called once at application startup
 */
export function initApiKeySync() {
  // Ensure localStorage has the latest mock accounts
  const savedKeysStr = localStorage.getItem('exchange_api_keys');
  if (!savedKeysStr) {
    // Initialize localStorage with DEFAULT_MOCK_ACCOUNTS
    const initialKeys = DEFAULT_MOCK_ACCOUNTS.map((account) => ({
      api_key_id: account.apiKeyId,
      exchange_id: account.exchangeId,
      key_nickname: account.name,
    }));
    localStorage.setItem('exchange_api_keys', JSON.stringify(initialKeys));
    console.log(
      'Initialized exchange_api_keys in localStorage with DEFAULT_MOCK_ACCOUNTS',
    );
  } else {
    // Update DEFAULT_MOCK_ACCOUNTS with nicknames from localStorage
    try {
      const savedKeys = JSON.parse(savedKeysStr);
      DEFAULT_MOCK_ACCOUNTS.forEach((account) => {
        const savedKey = savedKeys.find(
          (key: any) => key.api_key_id === account.apiKeyId,
        );
        if (savedKey && savedKey.key_nickname) {
          console.log(
            `Updating DEFAULT_MOCK_ACCOUNTS nickname for ${account.apiKeyId}: ${savedKey.key_nickname}`,
          );
          account.name = savedKey.key_nickname;
        }
      });
    } catch (error) {
      console.error(
        'Error updating DEFAULT_MOCK_ACCOUNTS from localStorage:',
        error,
      );
    }
  }
}
