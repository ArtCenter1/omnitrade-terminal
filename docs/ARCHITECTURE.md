# OmniTrade Architecture Overview

This document provides a high-level overview of the OmniTrade platform architecture. For more detailed documentation, please visit our [GitHub Wiki](https://github.com/yourusername/omnitrade/wiki).

## System Architecture

OmniTrade follows a modern full-stack architecture:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Frontend │◄────►│  Node.js Backend│◄────►│  External APIs  │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │                        │
        │                        │                        │
        ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Local Storage  │      │     Database    │      │      Redis      │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

## Frontend Architecture

- **Framework**: React with TypeScript
- **State Management**: React Hooks and Context API
- **Routing**: React Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **API Communication**: Axios for REST, WebSockets for real-time data
- **Build Tool**: Vite

### Key Frontend Components

- **Dashboard**: Portfolio overview and performance metrics
- **Terminal**: Trading interface with order book and charts
- **Account Management**: User account and exchange connections
- **Settings**: Application configuration and preferences
- **Admin UI**: Administrative features and user management

## Backend Architecture

- **Framework**: Node.js with Express
- **Database**: Prisma ORM with SQLite/PostgreSQL
- **Caching**: Redis for session management and data caching
- **Authentication**: Firebase Authentication
- **API Integration**: External exchange APIs and market data providers

### Key Backend Services

- **Authentication Service**: User authentication and authorization
- **Market Data Service**: Fetching and processing market data
- **Trading Service**: Order execution and management
- **Portfolio Service**: Portfolio tracking and performance calculation
- **Admin Service**: User management and system configuration

## Data Flow

1. **User Authentication**:
   - User logs in via Firebase Authentication
   - Backend validates tokens and establishes session

2. **Market Data**:
   - Backend fetches data from external APIs (CoinGecko, etc.)
   - Data is cached in Redis for performance
   - Real-time updates via WebSockets

3. **Trading Operations**:
   - User initiates trade in frontend
   - Request is validated by backend
   - Order is submitted to exchange API
   - Confirmation is returned to frontend

4. **Portfolio Tracking**:
   - Backend periodically fetches balances from exchanges
   - Portfolio data is stored in database
   - Performance metrics are calculated and cached

## Development Environments

OmniTrade supports three development/operation modes:

1. **Mock Mode**: Uses mock data for development without real API connections
2. **Sandbox Mode**: Uses real API connections but with test accounts
3. **Live Mode**: Uses real API connections with real accounts

## Security Architecture

- **Authentication**: JWT-based authentication with Firebase
- **Authorization**: Role-based access control (RBAC)
- **API Security**: API keys stored encrypted in database
- **Data Protection**: Sensitive data encrypted at rest
- **Network Security**: HTTPS for all communications

## Deployment Architecture

- **Frontend**: Static hosting (Vercel, Netlify, or similar)
- **Backend**: Containerized deployment with Docker
- **Database**: Managed database service
- **Caching**: Managed Redis service
- **CI/CD**: Automated testing and deployment pipeline

For more detailed architecture documentation, please visit our [GitHub Wiki](https://github.com/yourusername/omnitrade/wiki).
