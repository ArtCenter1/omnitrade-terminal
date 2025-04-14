# Frontend Component Structure

This document outlines the **current** structure for React components within the OpenTrade frontend application, reflecting the actual organization as of the last review. The goal is to promote reusability, maintainability, and a clear separation of concerns.

## Guiding Principles

- **Atomic Design Inspiration:** While not strictly adhering to Atomic Design, we'll draw inspiration from its principles: building interfaces from small, reusable pieces up to complex pages.
- **Feature-Based Grouping:** Group components related to specific features or pages together.
- **Clear Separation:** Distinguish between UI primitives, layout components, feature-specific components, and page-level components.
- **Reusability:** Design components to be reusable across different parts of the application where applicable.

## Current Directory Structure (within `src/components/`)

```
src/
├── components/
│   ├── ui/                     # shadcn/ui components (and potentially custom primitives)
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ... (Many more shadcn components)
│   │
│   ├── dashboard/              # Components specific to the Dashboard page
│   │   ├── DashboardHeader.tsx
│   │   ├── ExchangeAccountSelector.tsx
│   │   └── PortfolioIndicators.tsx
│   │
│   ├── profile/                # Components specific to the User Profile/Settings pages
│   │   ├── AccountInfo.tsx
│   │   ├── FAQSection.tsx
│   │   ├── ProfileLayout.tsx
│   │   └── ProfileSidebar.tsx
│   │
│   ├── terminal/               # Components specific to the Trading Terminal page
│   │   ├── AccountSelector.tsx
│   │   ├── AccountTabs.tsx
│   │   ├── AssetsTable.tsx
│   │   ├── AvailableBalances.tsx
│   │   ├── AssetChart.tsx
│   │   ├── ChartHeader.tsx
│   │   ├── ChartSection.tsx
│   │   ├── ExchangeSelector.tsx
│   │   ├── MarketSelector.tsx
│   │   ├── OrderBook.tsx
│   │   ├── PriceOverview.tsx
│   │   ├── TimeframeSelector.tsx
│   │   ├── TradingForm.tsx
│   │   └── TradingSidebar.tsx
│   │
│   ├── community/              # Components specific to the Community/Leaderboard page
│   │   ├── LeaderboardTable.tsx
│   │   ├── LeaderboardFilters.tsx
│   │   ├── BacktestLeaderboard.tsx
│   │   └── LiveTradeLeaderboard.tsx
│   │
│   ├── landing/                # Components specific to the public landing page (Conceptual)
│   │   ├── LeaderboardPreview.tsx # Component to show top bots on landing page
│   │   └── AiIntroSection.tsx     # Component for AI feature intro on landing page
│   │
│   ├── AllocationChart.tsx     # Root-level components (Layout, Common, Charts)
│   ├── AssetChart.tsx
│   ├── AssetRow.tsx
│   ├── BotCard.tsx
│   ├── Footer.tsx
│   ├── LandingNavbar.tsx
│   ├── Navbar.tsx
│   ├── PerformanceChart.tsx
│   ├── RewardCard.tsx
│   └── ThemeProvider.tsx
│   │
│   ├── ai/                     # Components specific to AI Trading features
│   │   ├── ByoaiConfigForm.tsx   # Form to configure a "Custom AI Signal" bot
│   │   ├── ApiKeyManager.tsx     # UI to display/generate/revoke API keys for BYOAI
│   │   ├── SignalLogViewer.tsx   # Component to display incoming signal logs (optional)
│   │   └── PlatformAiBotList.tsx # Placeholder for listing platform AI bots (Future)
│
├── hooks/                      # Custom React Hooks
│   └── ...
│
├── lib/                        # Utility functions, constants, type definitions
│   └── ...
│
├── pages/                      # Page-level components assembling feature components
│   ├── Dashboard.tsx           # (Assumed based on component structure)
│   ├── Terminal.tsx            # (Assumed based on component structure)
│   ├── Profile.tsx             # (Assumed based on component structure)
│   ├── Community.tsx           # (New page for leaderboards)
│   ├── AiTrading.tsx           # (New page for AI features)
│   └── ...                     # (Other pages TBD - Bots, Earn, etc.)
│
└── App.tsx                     # Main application component, routing setup
```

## Key Component Types

1.  **UI Primitives (`components/ui/`):** Base building blocks like Buttons, Inputs, Cards, etc. Primarily uses shadcn/ui components. Should be stateless and highly reusable.
2.  **Layout & Common Components (`components/` root):** Components defining overall page structure (e.g., `Navbar.tsx`, `Footer.tsx`, `ThemeProvider.tsx`) and reusable components used across features (e.g., `BotCard.tsx`, `RewardCard.tsx`, various charts) are currently located at the root of `src/components/`. The `Navbar.tsx` component includes direct navigation links for Dashboard, Terminal, Bots, Markets, Earn, and Community. _Consideration should be given to potentially grouping these into dedicated `layout/` and `common/` subdirectories in the future for better organization as the project grows._
3.  **(Removed - Merged into above)**
4.  **Feature Components (`components/<feature>/`):** Components specific to a particular feature area (Dashboard, Terminal, Profile). These might contain their own state and logic related to the feature.
5.  **Page Components (`pages/`):** Top-level components for each route/page. Responsible for fetching page-specific data and assembling layout and feature components.

---

_This structure provides a starting point and can be adapted as the application grows._
