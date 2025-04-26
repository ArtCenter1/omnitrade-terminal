// src/services/apiKeys/apiKeyManager.ts

/**
 * Interface for API key pairs
 */
export interface ApiKeyPair {
  id: string;
  apiKey: string;
  apiSecret: string;
  label: string;
  exchangeId: string;
  isTestnet: boolean;
  isDefault?: boolean;
  createdAt: Date;
  lastUsed?: Date;
}

/**
 * Service for managing API keys
 */
export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private readonly STORAGE_KEY = 'omnitrade_api_keys';
  private readonly TEST_KEYS_STORAGE_KEY = 'omnitrade_test_api_keys';

  /**
   * Get the singleton instance of ApiKeyManager
   */
  public static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  /**
   * Store an API key pair
   * @param keyPair The API key pair to store
   * @returns The ID of the stored key pair
   */
  public async storeApiKey(keyPair: Omit<ApiKeyPair, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Generate a unique ID
      const id = this.generateId();
      
      // Create the full key pair object
      const fullKeyPair: ApiKeyPair = {
        ...keyPair,
        id,
        createdAt: new Date(),
      };
      
      // Get existing keys
      const existingKeys = await this.getApiKeys(keyPair.exchangeId);
      
      // If this is the first key for this exchange, make it the default
      if (existingKeys.length === 0) {
        fullKeyPair.isDefault = true;
      }
      
      // Add the new key
      existingKeys.push(fullKeyPair);
      
      // Store the updated keys
      await this.storeKeys(existingKeys, keyPair.exchangeId);
      
      return id;
    } catch (error) {
      console.error('Error storing API key:', error);
      throw new Error('Failed to store API key');
    }
  }

  /**
   * Get all API keys for an exchange
   * @param exchangeId The exchange ID
   * @returns An array of API key pairs
   */
  public async getApiKeys(exchangeId: string): Promise<ApiKeyPair[]> {
    try {
      // Check if we're in development mode and should use test keys
      const useTestKeys = import.meta.env.DEV;
      const storageKey = useTestKeys ? this.TEST_KEYS_STORAGE_KEY : this.STORAGE_KEY;
      
      // Get the keys from storage
      const keysJson = localStorage.getItem(storageKey);
      if (!keysJson) {
        return [];
      }
      
      // Parse the keys
      const allKeys = JSON.parse(keysJson) as ApiKeyPair[];
      
      // Filter by exchange ID
      return allKeys.filter(key => key.exchangeId === exchangeId);
    } catch (error) {
      console.error('Error getting API keys:', error);
      return [];
    }
  }

  /**
   * Get an API key pair by ID
   * @param id The ID of the key pair to get
   * @returns The API key pair, or null if not found
   */
  public async getApiKeyById(id: string): Promise<ApiKeyPair | null> {
    try {
      // Check if we're in development mode and should use test keys
      const useTestKeys = import.meta.env.DEV;
      const storageKey = useTestKeys ? this.TEST_KEYS_STORAGE_KEY : this.STORAGE_KEY;
      
      // Get the keys from storage
      const keysJson = localStorage.getItem(storageKey);
      if (!keysJson) {
        return null;
      }
      
      // Parse the keys
      const allKeys = JSON.parse(keysJson) as ApiKeyPair[];
      
      // Find the key by ID
      const key = allKeys.find(key => key.id === id);
      
      return key || null;
    } catch (error) {
      console.error('Error getting API key by ID:', error);
      return null;
    }
  }

  /**
   * Get the default API key pair for an exchange
   * @param exchangeId The exchange ID
   * @returns The default API key pair, or null if none exists
   */
  public async getDefaultApiKey(exchangeId: string): Promise<ApiKeyPair | null> {
    try {
      // Get all keys for the exchange
      const keys = await this.getApiKeys(exchangeId);
      
      // Find the default key
      const defaultKey = keys.find(key => key.isDefault);
      
      // If no default key is found, use the first key
      return defaultKey || (keys.length > 0 ? keys[0] : null);
    } catch (error) {
      console.error('Error getting default API key:', error);
      return null;
    }
  }

  /**
   * Set an API key pair as the default for an exchange
   * @param id The ID of the key pair to set as default
   * @returns True if successful, false otherwise
   */
  public async setDefaultApiKey(id: string): Promise<boolean> {
    try {
      // Check if we're in development mode and should use test keys
      const useTestKeys = import.meta.env.DEV;
      const storageKey = useTestKeys ? this.TEST_KEYS_STORAGE_KEY : this.STORAGE_KEY;
      
      // Get the keys from storage
      const keysJson = localStorage.getItem(storageKey);
      if (!keysJson) {
        return false;
      }
      
      // Parse the keys
      const allKeys = JSON.parse(keysJson) as ApiKeyPair[];
      
      // Find the key by ID
      const keyToSetDefault = allKeys.find(key => key.id === id);
      if (!keyToSetDefault) {
        return false;
      }
      
      // Get the exchange ID
      const exchangeId = keyToSetDefault.exchangeId;
      
      // Update all keys for this exchange
      allKeys.forEach(key => {
        if (key.exchangeId === exchangeId) {
          key.isDefault = key.id === id;
        }
      });
      
      // Store the updated keys
      localStorage.setItem(storageKey, JSON.stringify(allKeys));
      
      return true;
    } catch (error) {
      console.error('Error setting default API key:', error);
      return false;
    }
  }

  /**
   * Delete an API key pair
   * @param id The ID of the key pair to delete
   * @returns True if successful, false otherwise
   */
  public async deleteApiKey(id: string): Promise<boolean> {
    try {
      // Check if we're in development mode and should use test keys
      const useTestKeys = import.meta.env.DEV;
      const storageKey = useTestKeys ? this.TEST_KEYS_STORAGE_KEY : this.STORAGE_KEY;
      
      // Get the keys from storage
      const keysJson = localStorage.getItem(storageKey);
      if (!keysJson) {
        return false;
      }
      
      // Parse the keys
      const allKeys = JSON.parse(keysJson) as ApiKeyPair[];
      
      // Find the key by ID
      const keyToDelete = allKeys.find(key => key.id === id);
      if (!keyToDelete) {
        return false;
      }
      
      // Get the exchange ID and check if this is the default key
      const exchangeId = keyToDelete.exchangeId;
      const isDefault = keyToDelete.isDefault;
      
      // Remove the key
      const updatedKeys = allKeys.filter(key => key.id !== id);
      
      // If this was the default key, set a new default
      if (isDefault) {
        const exchangeKeys = updatedKeys.filter(key => key.exchangeId === exchangeId);
        if (exchangeKeys.length > 0) {
          exchangeKeys[0].isDefault = true;
        }
      }
      
      // Store the updated keys
      localStorage.setItem(storageKey, JSON.stringify(updatedKeys));
      
      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
      return false;
    }
  }

  /**
   * Update the last used timestamp for an API key pair
   * @param id The ID of the key pair to update
   * @returns True if successful, false otherwise
   */
  public async updateLastUsed(id: string): Promise<boolean> {
    try {
      // Check if we're in development mode and should use test keys
      const useTestKeys = import.meta.env.DEV;
      const storageKey = useTestKeys ? this.TEST_KEYS_STORAGE_KEY : this.STORAGE_KEY;
      
      // Get the keys from storage
      const keysJson = localStorage.getItem(storageKey);
      if (!keysJson) {
        return false;
      }
      
      // Parse the keys
      const allKeys = JSON.parse(keysJson) as ApiKeyPair[];
      
      // Find the key by ID
      const keyIndex = allKeys.findIndex(key => key.id === id);
      if (keyIndex === -1) {
        return false;
      }
      
      // Update the last used timestamp
      allKeys[keyIndex].lastUsed = new Date();
      
      // Store the updated keys
      localStorage.setItem(storageKey, JSON.stringify(allKeys));
      
      return true;
    } catch (error) {
      console.error('Error updating last used timestamp:', error);
      return false;
    }
  }

  /**
   * Check if any API keys exist for an exchange
   * @param exchangeId The exchange ID
   * @returns True if API keys exist, false otherwise
   */
  public async hasApiKeys(exchangeId: string): Promise<boolean> {
    const keys = await this.getApiKeys(exchangeId);
    return keys.length > 0;
  }

  /**
   * Store API keys in local storage
   * @param keys The API keys to store
   * @param exchangeId The exchange ID
   */
  private async storeKeys(keys: ApiKeyPair[], exchangeId: string): Promise<void> {
    try {
      // Check if we're in development mode and should use test keys
      const useTestKeys = import.meta.env.DEV;
      const storageKey = useTestKeys ? this.TEST_KEYS_STORAGE_KEY : this.STORAGE_KEY;
      
      // Get all existing keys
      const keysJson = localStorage.getItem(storageKey);
      let allKeys: ApiKeyPair[] = [];
      
      if (keysJson) {
        // Parse existing keys
        allKeys = JSON.parse(keysJson) as ApiKeyPair[];
        
        // Remove existing keys for this exchange
        allKeys = allKeys.filter(key => key.exchangeId !== exchangeId);
      }
      
      // Add the new keys
      allKeys.push(...keys);
      
      // Store the updated keys
      localStorage.setItem(storageKey, JSON.stringify(allKeys));
    } catch (error) {
      console.error('Error storing keys:', error);
      throw new Error('Failed to store keys');
    }
  }

  /**
   * Generate a unique ID
   * @returns A unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  /**
   * Add a test API key for development
   * @param exchangeId The exchange ID
   * @param apiKey The API key
   * @param apiSecret The API secret
   * @returns The ID of the stored key pair
   */
  public async addTestApiKey(
    exchangeId: string,
    apiKey: string,
    apiSecret: string
  ): Promise<string> {
    return this.storeApiKey({
      apiKey,
      apiSecret,
      label: 'Test Key',
      exchangeId,
      isTestnet: true,
      isDefault: true,
    });
  }
}
