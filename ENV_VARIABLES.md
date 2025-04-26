# Environment Variables Documentation

This document explains the environment variables used in the OmniTrade platform and where they are located.

## Frontend Environment Variables (/.env)

These variables are accessible in the client-side code and are prefixed with `VITE_`.

### Authentication

- `VITE_AUTH_PROVIDER`: Authentication provider selection (e.g., 'firebase')

### Firebase Configuration

- `VITE_FIREBASE_API_KEY`: Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Firebase app ID
- `VITE_FIREBASE_MEASUREMENT_ID`: Firebase measurement ID

### Market Data Endpoints

- `VITE_MARKET_DATA_API_URL`: URL for the market data API
- `VITE_MARKET_DATA_WS_URL`: WebSocket URL for real-time market data

### CoinGecko API

- `VITE_COINGECKO_API_KEY`: API key for CoinGecko's free tier API

### Binance Testnet API

- `VITE_BINANCE_TESTNET_API_KEY`: API key for Binance Testnet (required for sandbox trading)
- `VITE_BINANCE_TESTNET_API_SECRET`: API secret for Binance Testnet (required for sandbox trading)

## Backend Environment Variables (/backend/.env)

These variables are only accessible on the server-side and are NOT exposed to the client.

### API Configuration

- `PORT`: Port number for the backend server
- `NODE_ENV`: Environment (development, production, etc.)

### Database Configuration

- `DATABASE_URL`: Connection string for the database

### Security

- `JWT_SECRET`: Secret for JWT token generation
- `COOKIE_SECRET`: Secret for cookie signing

### External APIs

- `COINGECKO_API_BASE_URL`: Base URL for CoinGecko API
- `COINGECKO_API_KEY`: Server-side API key for CoinGecko (if needed)

## How to Use

### Frontend Variables

Frontend variables are accessed in the code using:

```typescript
const apiKey = import.meta.env.VITE_COINGECKO_API_KEY;
```

### Backend Variables

Backend variables are accessed using:

```javascript
const apiKey = process.env.COINGECKO_API_KEY;
```

## Important Notes

1. Never commit `.env` files to version control
2. Always use the appropriate prefix (`VITE_`) for frontend variables
3. Keep sensitive information in the backend `.env` file only
4. Use sample `.env.example` files for documentation
