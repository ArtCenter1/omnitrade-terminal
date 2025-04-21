# OmniTrade Environment Setup

This guide provides essential information for setting up the OmniTrade development environment. For more detailed instructions, please visit our [GitHub Wiki](https://github.com/yourusername/omnitrade/wiki/Getting-Started).

## Prerequisites

- **Node.js** (v16 or later)
- **npm** (v7 or later)
- **Git**
- **Redis** (for backend caching)

## Quick Setup

### Frontend

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file and fill in the required values.

3. **Start the development server**:
   ```bash
   npm run dev
   ```

### Backend

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```

4. **Start Redis**:
   ```bash
   # Using Docker
   docker run -p 6379:6379 redis:alpine
   ```

5. **Start the backend development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

### Frontend (.env)

- `VITE_AUTH_PROVIDER`: Authentication provider selection
- `VITE_FIREBASE_*`: Firebase configuration variables
- `VITE_MARKET_DATA_API_URL`: URL for the market data API
- `VITE_MARKET_DATA_WS_URL`: WebSocket URL for real-time market data
- `VITE_COINGECKO_API_KEY`: API key for CoinGecko

### Backend (backend/.env)

- `DATABASE_URL`: Connection string for the database
- `REDIS_URL`: Connection string for Redis
- `SESSION_SECRET`: Secret for session management
- `COINGECKO_API_BASE_URL`: Base URL for CoinGecko API

## Development Modes

OmniTrade supports three development modes:

1. **Mock Mode**: Uses mock data for development
2. **Sandbox Mode**: Uses real API connections with test accounts
3. **Live Mode**: Uses real API connections with real accounts

You can switch between these modes in the Developer Tools section of the application.

## Common Issues

- **Redis Connection Error**: Ensure Redis is running before starting the backend
- **API Key Issues**: Verify that all API keys are correctly set in the environment variables
- **Port Conflicts**: Check if ports 8080 (frontend) and 3000 (backend) are available

For more detailed troubleshooting, please refer to our [GitHub Wiki](https://github.com/yourusername/omnitrade/wiki).
