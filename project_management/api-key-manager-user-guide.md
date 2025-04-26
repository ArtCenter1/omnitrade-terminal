# API Key Manager User Guide

This guide explains how to use the API Key Manager to add, manage, and test Binance Testnet API keys in the application.

## Table of Contents

1. [Overview](#overview)
2. [Using the UI](#using-the-ui)
3. [Using the API Programmatically](#using-the-api-programmatically)
4. [Getting Binance Testnet API Keys](#getting-binance-testnet-api-keys)
5. [Verifying Your Keys](#verifying-your-keys)
6. [Troubleshooting](#troubleshooting)
7. [Security Considerations](#security-considerations)

## Overview

The API Key Manager is a critical component that allows you to securely store and manage API keys for various exchanges, including Binance Testnet. Since Binance Testnet serves as our default matching engine, configuring these API keys is essential for testing order placement and trading functionality.

## Using the UI

### Accessing the API Key Manager

1. **Navigate to Developer Settings**:

   - Go to `/admin/dev-settings` or access it through the Admin Dashboard

2. **Enable Binance Testnet**:

   - In the Binance Testnet Integration section, toggle the switch to "Enabled"

3. **Access the Exchange Settings**:
   - Scroll down to the "Exchange Settings" section
   - You'll see the Binance Testnet settings with tabs for "API Keys" and "Connection Test"

### Adding API Keys

1. Click on the "Add API Key" button
2. Fill in the form:
   - **Label**: A name for your API key (e.g., "My Testnet Key")
   - **API Key**: Your Binance Testnet API key
   - **API Secret**: Your Binance Testnet API secret
   - **This is a testnet API key**: Keep this checked
   - **Make this the default API key**: Check this if you want this to be the default key
3. Click "Add API Key" to save

### Managing API Keys

- **View Keys**: All your API keys are listed in a table showing label, partial API key, creation date, and last used date
- **Set Default**: Click the star icon to set a key as the default for that exchange
- **Delete**: Click the trash icon to delete a key

### Testing API Keys

1. Switch to the "Connection Test" tab
2. Check the connection status indicator at the top right
3. Click "Test Connection" to verify your API key works
4. Review the results:
   - Green "Connected" badge indicates a successful connection to Binance Testnet
   - "Using Mock Data" badge indicates the system is falling back to mock data

## Using the API Programmatically

For developers who need to work with the API Key Manager in code:

### Importing and Initializing

```typescript
// Import the ApiKeyManager
import { ApiKeyManager } from '@/services/apiKeys/apiKeyManager';

// Get the singleton instance
const apiKeyManager = ApiKeyManager.getInstance();
```

### Adding API Keys

```typescript
// Quick method for adding a test key
async function addTestnetKey() {
  try {
    const id = await apiKeyManager.addTestApiKey(
      'binance_testnet',
      'YOUR_API_KEY_HERE',
      'YOUR_API_SECRET_HERE',
    );

    console.log('Added API key with ID:', id);
    return id;
  } catch (error) {
    console.error('Error adding API key:', error);
  }
}

// Full method with all options
async function addFullTestnetKey() {
  try {
    const id = await apiKeyManager.storeApiKey({
      apiKey: 'YOUR_API_KEY_HERE',
      apiSecret: 'YOUR_API_SECRET_HERE',
      label: 'My Testnet Key',
      exchangeId: 'binance_testnet',
      isTestnet: true,
      isDefault: true,
    });

    console.log('Added API key with ID:', id);
    return id;
  } catch (error) {
    console.error('Error adding API key:', error);
  }
}
```

### Retrieving API Keys

```typescript
// Get all keys for an exchange
async function getAllKeys() {
  const keys = await apiKeyManager.getApiKeys('binance_testnet');
  console.log('All keys:', keys);
  return keys;
}

// Get the default key
async function getDefaultKey() {
  const key = await apiKeyManager.getDefaultApiKey('binance_testnet');
  console.log('Default key:', key);
  return key;
}

// Get a specific key by ID
async function getKeyById(id) {
  const key = await apiKeyManager.getApiKeyById(id);
  console.log('Key:', key);
  return key;
}
```

### Managing API Keys

```typescript
// Set a key as default
async function setDefaultKey(id) {
  const success = await apiKeyManager.setDefaultApiKey(id);
  console.log('Set as default:', success);
  return success;
}

// Delete a key
async function deleteKey(id) {
  const success = await apiKeyManager.deleteApiKey(id);
  console.log('Deleted:', success);
  return success;
}

// Check if any keys exist
async function hasAnyKeys() {
  const hasKeys = await apiKeyManager.hasApiKeys('binance_testnet');
  console.log('Has keys:', hasKeys);
  return hasKeys;
}
```

### Using with React Hooks

The application provides a convenient hook for React components:

```typescript
import { useApiKeys } from '@/hooks/useApiKeys';

function MyComponent() {
  const {
    apiKeys,
    defaultKey,
    loading,
    error,
    addApiKey,
    deleteApiKey,
    setAsDefault,
    loadApiKeys,
    hasKeys,
  } = useApiKeys('binance_testnet');

  // Now you can use these functions and state in your component
}
```

## Getting Binance Testnet API Keys

To obtain Binance Testnet API keys:

1. Go to [https://testnet.binance.vision/](https://testnet.binance.vision/)
2. Log in with your GitHub or Google account
3. Click on "Generate HMAC_SHA256 Key"
4. Copy the API Key and Secret Key
5. Store these keys securely - you won't be able to view the secret again

## Verifying Your Keys

After adding your keys, verify they're working:

1. Go to the "Connection Test" tab in the Binance Testnet settings
2. Check the connection status indicator:

   - **Green "Connected"**: Successfully connected to Binance Testnet
   - **Yellow "Using Mock Data"**: Connected but using mock data
   - **Red "Disconnected"**: Failed to connect

3. Click "Test Connection" to perform a full test
4. If successful, you'll see:
   - Sample trading pairs from Binance Testnet
   - A success message without any mention of mock data

## Troubleshooting

### Common Issues

1. **"No API Keys Found" Warning**

   - You need to add API keys in the API Keys tab
   - Follow the instructions to get keys from Binance Testnet

2. **"Using Mock Data" Status**

   - Your API keys may be invalid or expired
   - The application is falling back to mock data
   - Try generating new API keys

3. **Connection Errors**
   - Check your internet connection
   - Verify that Binance Testnet is operational
   - Ensure your API keys have the correct permissions

### Debugging Tips

- Check the browser console for detailed error messages
- Verify that the Binance Testnet feature flag is enabled
- Try refreshing the connection status using the refresh button
- Ensure you're using testnet keys, not production keys

## Security Considerations

- API keys are stored in the browser's localStorage, which is not suitable for production use with real funds
- For production, implement a more secure storage solution with proper encryption
- Never share your API keys or commit them to version control
- Use environment variables for development and testing
- Regularly rotate your API keys, especially if you suspect they may be compromised

---

**Note**: This API Key Manager is specifically designed for development and testing purposes. For production use with real funds, additional security measures would be required.
