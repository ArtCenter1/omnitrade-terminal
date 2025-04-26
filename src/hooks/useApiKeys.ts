// src/hooks/useApiKeys.ts
import { useState, useEffect, useCallback } from 'react';
import { ApiKeyManager, ApiKeyPair } from '@/services/apiKeys/apiKeyManager';

/**
 * Hook for managing API keys in React components
 * @param exchangeId The exchange ID to get keys for
 */
export function useApiKeys(exchangeId: string) {
  const [apiKeys, setApiKeys] = useState<ApiKeyPair[]>([]);
  const [defaultKey, setDefaultKey] = useState<ApiKeyPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the API key manager instance
  const apiKeyManager = ApiKeyManager.getInstance();

  // Load API keys
  const loadApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all keys for the exchange
      const keys = await apiKeyManager.getApiKeys(exchangeId);
      setApiKeys(keys);

      // Get the default key
      const defaultKey = await apiKeyManager.getDefaultApiKey(exchangeId);
      setDefaultKey(defaultKey);
    } catch (err) {
      console.error('Error loading API keys:', err);
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  }, [exchangeId, apiKeyManager]);

  // Load API keys on mount and when exchangeId changes
  useEffect(() => {
    loadApiKeys();
  }, [loadApiKeys]);

  // Add a new API key
  const addApiKey = useCallback(
    async (
      apiKey: string,
      apiSecret: string,
      label: string,
      isTestnet: boolean = false,
      makeDefault: boolean = false
    ) => {
      try {
        setError(null);

        // Store the new key
        const id = await apiKeyManager.storeApiKey({
          apiKey,
          apiSecret,
          label,
          exchangeId,
          isTestnet,
          isDefault: makeDefault,
        });

        // Reload the keys
        await loadApiKeys();

        // If makeDefault is true, set this key as the default
        if (makeDefault) {
          await apiKeyManager.setDefaultApiKey(id);
          await loadApiKeys();
        }

        return id;
      } catch (err) {
        console.error('Error adding API key:', err);
        setError('Failed to add API key');
        return null;
      }
    },
    [exchangeId, apiKeyManager, loadApiKeys]
  );

  // Delete an API key
  const deleteApiKey = useCallback(
    async (id: string) => {
      try {
        setError(null);

        // Delete the key
        const success = await apiKeyManager.deleteApiKey(id);

        // Reload the keys
        if (success) {
          await loadApiKeys();
        }

        return success;
      } catch (err) {
        console.error('Error deleting API key:', err);
        setError('Failed to delete API key');
        return false;
      }
    },
    [apiKeyManager, loadApiKeys]
  );

  // Set a key as the default
  const setAsDefault = useCallback(
    async (id: string) => {
      try {
        setError(null);

        // Set the key as default
        const success = await apiKeyManager.setDefaultApiKey(id);

        // Reload the keys
        if (success) {
          await loadApiKeys();
        }

        return success;
      } catch (err) {
        console.error('Error setting default API key:', err);
        setError('Failed to set default API key');
        return false;
      }
    },
    [apiKeyManager, loadApiKeys]
  );

  // Check if any keys exist
  const hasKeys = apiKeys.length > 0;

  return {
    apiKeys,
    defaultKey,
    loading,
    error,
    addApiKey,
    deleteApiKey,
    setAsDefault,
    loadApiKeys,
    hasKeys,
  };
}
