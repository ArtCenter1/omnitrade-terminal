# Revised Plan: Frontend Market Data Integration

## Phase 1: Foundation &amp; Setup

1.  **Deep Dive into API Specs:**
    - Thoroughly review `project_management/market_data_api_openapi.yaml` to understand REST endpoints, request/response schemas, authentication (API keys?), and potential rate limits.
    - Analyze `project_management/market_data_websocket.md` for connection details, subscription messages, event formats, and error handling protocols.
2.  **Technology Selection &amp; Architecture:**
    - **State Management:** Choose a suitable library (e.g., Zustand, Redux Toolkit, Jotai) for managing potentially complex and frequently updating market data state globally. _Recommendation: Zustand for simplicity if complex middleware isn't needed._
    - **Data Fetching (REST):** Select a library like React Query or SWR to handle REST data fetching, caching, and automatic refetching. _Recommendation: React Query for its robust features._
    - **WebSocket Client:** Choose a reliable library like `socket.io-client` (if backend uses it) or `reconnecting-websocket` for handling connections, reconnections, and message parsing.
    - **(Optional) OpenAPI Code Generation:** Evaluate using a tool like `openapi-typescript-codegen` to generate TypeScript types and potentially basic client functions from the OpenAPI spec, ensuring type safety and reducing boilerplate.
3.  **Configuration &amp; Environment:**
    - Define API base URLs and WebSocket endpoints in environment variables (`.env`) for different environments (development, production).
    - **Authentication Provider:** Firebase is used for authentication. Ensure the necessary Firebase environment variables are configured as described in the `README.md`.
    - Install selected libraries (`zustand`, `react-query`, `reconnecting-websocket`, etc.).
4.  **Project Structure:**
    - Confirm/create directories:
      - `src/services/` (for API/WebSocket logic)
      - `src/hooks/` (for custom data hooks)
      - `src/store/` or `src/state/` (for state management configuration)
      - `src/types/` (if not using code generation for types)

## Phase 2: Implementation

5.  **Type Definitions:**
    - Generate types using OpenAPI tool OR manually define TypeScript interfaces/types for all API responses and WebSocket messages in `src/types/marketData.ts`.
6.  **REST API Service (`src/services/marketDataApi.ts`):**
    - Implement functions using React Query's `useQuery` (or equivalent) for fetching data (`getSymbols`, `getTicker`, `getOrderbook`, etc.).
    - Handle API key injection (if required) and implement robust error handling (catching errors, logging, potentially showing user feedback).
    - Configure caching strategies within React Query.
7.  **WebSocket Service (`src/services/marketDataSocket.ts`):**
    - Create a singleton class or utility to manage the WebSocket connection using the chosen library.
    - Implement methods for `connect`, `disconnect`, `subscribe(symbol, channel)`, `unsubscribe(symbol, channel)`.
    - Handle incoming messages, parse data, and manage connection state (connected, disconnected, errors).
    - Implement reconnection logic.
8.  **State Management Integration (`src/store/marketDataStore.ts` or similar):**
    - Set up a Zustand store (or equivalent) to hold market data (e.g., tickers, orderbooks).
    - Create actions/reducers to update the store based on WebSocket messages.
    - Connect the WebSocket service to dispatch updates to the store.
    - Consider data normalization if necessary.
9.  **Custom React Hooks (`src/hooks/`):**
    - Create specific hooks abstracting data access:
      - `useSymbols()`: Fetches symbol list via React Query.
      - `useTicker(symbol)`: Fetches initial ticker via React Query and subscribes to WebSocket updates via the store.
      - `useOrderbook(symbol)`: Similar to `useTicker` for order book data.
      - `useTrades(symbol)`: Similar for trade data.
      - `useKlines(symbol, interval)`: Similar for Klines/candlestick data.
    - These hooks should select data from the state store and handle WebSocket subscriptions/unsubscriptions automatically based on component mount/unmount or symbol changes.
    - Implement throttling/debouncing within hooks or the store if UI performance suffers from high-frequency updates.

## Phase 3: Integration &amp; Refinement

10. **UI Integration:**
    - Refactor existing components (e.g., `src/pages/Markets.tsx`, potentially parts of the trading terminal) to use the new custom hooks instead of static data or direct API calls.
11. **Testing:**
    - Write unit tests for service functions, state store logic, and custom hooks (using libraries like Vitest/Jest and React Testing Library).
    - Consider integration tests for key user flows involving market data.
12. **Documentation:**
    - This file (`reference_files/frontend_market_data_integration.md`) serves as the primary documentation.
    - Add JSDoc comments to services, hooks, and types.
