# Binance Testnet API Key Management

## Overview

This document outlines the implementation plan for securely managing Binance Testnet API keys, which is a **critical component** for enabling order placement and trading functionality in the application.

## Critical Context

- The application does not have a built-in matching engine
- Binance Testnet serves as our default matching engine for order execution
- Order placement testing is blocked until we successfully connect to Binance Testnet
- All trading functionality depends on this integration
- Secure API key management is essential for this integration to work

## Implementation Plan

### Phase 1: Secure Storage (CRITICAL)

1. **Environment Variables Setup**
   - Create `.env` file template with placeholders for Binance Testnet API keys
   - Add documentation for setting up environment variables
   - Implement environment variable loading in the application

2. **Secure Storage Implementation**
   - Create a secure storage service for API keys
   - Implement encryption for stored API keys
   - Create methods for securely retrieving API keys
   - Add validation to ensure API keys are properly formatted

3. **User Interface for API Key Management**
   - Create a form for users to input their Binance Testnet API keys
   - Implement validation for API key format
   - Add secure storage of API keys
   - Create UI for managing existing API keys

### Phase 2: Connection Status (HIGH PRIORITY)

1. **Connection Status Tracking**
   - Implement a service to track connection status to Binance Testnet
   - Create methods for checking connection health
   - Add automatic reconnection logic
   - Implement event system for connection status changes

2. **UI Indicators**
   - Create clear visual indicators for connection status
   - Add tooltips explaining connection status
   - Implement notifications for connection changes
   - Create error messages for connection failures

### Phase 3: Guided Setup (HIGH PRIORITY)

1. **Setup Wizard**
   - Create a step-by-step wizard for setting up Binance Testnet
   - Include instructions for creating a Binance Testnet account
   - Add guidance for generating API keys
   - Implement validation at each step

2. **Documentation**
   - Create comprehensive documentation for Binance Testnet setup
   - Add troubleshooting guide for common issues
   - Include screenshots and examples
   - Create video tutorial (optional)

## Technical Implementation Details

### API Key Storage

```typescript
// Example implementation for secure API key storage
interface ApiKeyPair {
  apiKey: string;
  apiSecret: string;
  label: string;
  exchangeId: string;
  isTestnet: boolean;
}

class ApiKeyManager {
  // Store API keys securely
  async storeApiKey(userId: string, keyPair: ApiKeyPair): Promise<string> {
    // Encrypt API secret before storage
    const encryptedSecret = await this.encryptSecret(keyPair.apiSecret);
    
    // Store in secure storage (database, secure localStorage, etc.)
    // Return ID of stored key pair
  }
  
  // Retrieve API keys securely
  async getApiKey(userId: string, keyId: string): Promise<ApiKeyPair> {
    // Retrieve from secure storage
    // Decrypt API secret
    // Return key pair
  }
  
  // Validate API key with exchange
  async validateApiKey(keyPair: ApiKeyPair): Promise<boolean> {
    // Make test request to exchange API
    // Return true if valid, false otherwise
  }
  
  // Encrypt API secret
  private async encryptSecret(secret: string): Promise<string> {
    // Use strong encryption
    // Return encrypted secret
  }
  
  // Decrypt API secret
  private async decryptSecret(encryptedSecret: string): Promise<string> {
    // Decrypt secret
    // Return decrypted secret
  }
}
```

### Connection Status Tracking

```typescript
// Example implementation for connection status tracking
enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

interface ConnectionStatusInfo {
  status: ConnectionStatus;
  lastChecked: Date;
  error?: Error;
  latency?: number;
}

class ConnectionManager {
  private connectionStatus: Map<string, ConnectionStatusInfo> = new Map();
  
  // Check connection status
  async checkConnection(exchangeId: string): Promise<ConnectionStatusInfo> {
    // Make test request to exchange API
    // Update and return connection status
  }
  
  // Get current connection status
  getConnectionStatus(exchangeId: string): ConnectionStatusInfo {
    return this.connectionStatus.get(exchangeId) || {
      status: ConnectionStatus.DISCONNECTED,
      lastChecked: new Date(),
    };
  }
  
  // Subscribe to connection status changes
  subscribeToConnectionStatus(
    exchangeId: string,
    callback: (status: ConnectionStatusInfo) => void
  ): () => void {
    // Add callback to subscribers
    // Return unsubscribe function
  }
}
```

## UI Components

1. **API Key Management Form**
   - Form for adding/editing API keys
   - Validation for API key format
   - Test connection button
   - Save/cancel buttons

2. **Connection Status Indicator**
   - Visual indicator showing connection status
   - Tooltip with detailed information
   - Reconnect button for manual reconnection
   - Last checked timestamp

3. **Setup Wizard**
   - Step-by-step guide for setting up Binance Testnet
   - Progress indicator
   - Next/back buttons
   - Completion confirmation

## Success Criteria

- Users can securely store and manage their Binance Testnet API keys
- Connection status is clearly visible in the UI
- Users can easily set up Binance Testnet through the guided wizard
- Order placement and execution works through Binance Testnet
- Fallback to mock data works when Testnet is unavailable

## Timeline

- **Phase 1 (Secure Storage)**: 2-3 days
- **Phase 2 (Connection Status)**: 1-2 days
- **Phase 3 (Guided Setup)**: 2-3 days

## Resources

- [Binance Testnet Documentation](https://testnet.binance.vision/)
- [Binance API Documentation](https://binance-docs.github.io/apidocs/spot/en/)
- [Existing Sandbox Implementation](src/services/exchange/sandboxAdapter.ts)
