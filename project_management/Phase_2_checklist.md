# Phase 2 Checklist: Frontend Core Development

**Workflow Note:** Please complete the tasks in this checklist sequentially, one by one. Reordering is permissible only if it demonstrably leads to a more efficient or effective outcome.

## Phase Objective
Implement the core user interface components, pages, and navigation for the OpenTrade frontend application based on the designs and specifications from Phase 1.

## Tasks

*   [x] Leverage shadcn/ui component library (Setup complete, custom components built as needed)
*   [x] Develop responsive layout (Core layout uses Tailwind responsive classes; Navbar includes mobile drawer)
*   [x] Create authentication UI (Login, Registration, Password Reset forms/pages created and routed)
*   [x] Build Dashboard page UI (Page structure, header, charts, and portfolio tabs implemented)
*   [x] Build Terminal page UI (Page structure with sidebar, chart, order book, and assets table implemented)
*   [x] Build Bots management page UI (Initial structure for browsing/discovering bots implemented)
*   [x] Build Markets page UI (Market overview table with mock data, search, and pagination implemented)
*   [x] Build Earn/Rewards page UI (Tabbed interface for Holders, Liquidity, and Referral programs implemented)
*   [x] Build Community page UI (Leaderboard page created with filters and table components, routed)
*   [x] Implement Landing Page Leaderboard Preview section (Component created and added to Index page)
*   [x] Implement navigation and routing (Navbar/Footer links updated, ProtectedRoute structure added)

---

## Frontend Market Data Integration

**Objective:** Develop dedicated frontend integration for the Market Data API, including REST and WebSocket support, robust state management, and real-time updates.

**Checklist:**
- [ ] **Phase 1: Foundation & Setup**
  - [x] Review `market_data_api_openapi.yaml` and `market_data_websocket.md` for endpoint/event details, schemas, and authentication.
  - [ ] Select and configure state management (e.g., Zustand), data fetching (e.g., React Query), and WebSocket client libraries.
  - [ ] Define API base URLs and WebSocket endpoints in environment variables (`.env`).
  - [ ] Install selected libraries (`zustand`, `react-query`, `reconnecting-websocket`, etc.).
  - [ ] Confirm/create directories: `src/services/`, `src/hooks/`, `src/store/`, `src/types/`.
- [ ] **Phase 2: Implementation**
  - [ ] Define or generate TypeScript types for all API responses and WebSocket messages in `src/types/marketData.ts`.
  - [ ] Implement `src/services/marketDataApi.ts` using React Query for REST API calls (getSymbols, getTicker, getOrderbook, etc.). Handle errors and API keys.
  - [ ] Implement `src/services/marketDataSocket.ts` for WebSocket management (connect, disconnect, subscribe, unsubscribe, handle messages, reconnection).
  - [ ] Implement `src/store/marketDataStore.ts` (or similar) using Zustand to hold data and handle updates from WebSocket.
  - [ ] Implement custom React Hooks (`src/hooks/`) like `useSymbols`, `useTicker`, `useOrderbook`, etc., integrating React Query, Zustand, and WebSocket subscriptions.
- [ ] **Phase 3: Integration & Refinement**
  - [ ] Refactor UI components (e.g., `Markets.tsx`, Trading Terminal) to use the new custom hooks.
  - [ ] Write unit/integration tests for services, store, and hooks.
  - [ ] Add JSDoc comments to new code.

---
*Mark items as complete ([x]) as development progresses.*
