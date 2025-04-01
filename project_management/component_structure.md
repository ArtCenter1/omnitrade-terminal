# Frontend Component Structure

This document outlines the proposed structure for React components within the OpenTrade frontend application. The goal is to promote reusability, maintainability, and a clear separation of concerns.

## Guiding Principles

*   **Atomic Design Inspiration:** While not strictly adhering to Atomic Design, we'll draw inspiration from its principles: building interfaces from small, reusable pieces up to complex pages.
*   **Feature-Based Grouping:** Group components related to specific features or pages together.
*   **Clear Separation:** Distinguish between UI primitives, layout components, feature-specific components, and page-level components.
*   **Reusability:** Design components to be reusable across different parts of the application where applicable.

## Proposed Directory Structure (within `src/components/`)

```
src/
├── components/
│   ├── ui/                 # Generic, reusable UI primitives (shadcn/ui components, potentially custom ones)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ... (Existing shadcn components)
│   │
│   ├── layout/             # Components defining overall page structure and layout
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx      # (If needed for specific layouts)
│   │   └── PageWrapper.tsx  # (Optional: Common padding/margins)
│   │
│   ├── common/             # Reusable components not specific to one feature (e.g., charts, selectors)
│   │   ├── AssetIcon.tsx
│   │   ├── ExchangeSelector.tsx
│   │   ├── MarketSelector.tsx
│   │   ├── TimeframeSelector.tsx # (Already exists)
│   │   ├── PriceLabel.tsx
│   │   └── DataTable.tsx      # (Generic table component if needed beyond shadcn)
│   │
│   ├── charts/             # Specific charting components (wrappers or custom implementations)
│   │   ├── TradingViewChart.tsx # (Wrapper around TradingView widget/library)
│   │   ├── PortfolioAllocationChart.tsx
│   │   └── PerformanceLineChart.tsx
│   │
│   ├── dashboard/          # Components specific to the Dashboard page
│   │   ├── DashboardHeader.tsx # (Already exists)
│   │   ├── PortfolioOverview.tsx
│   │   ├── AssetAllocation.tsx
│   │   └── RecentActivity.tsx
│   │
│   ├── terminal/           # Components specific to the Trading Terminal page
│   │   ├── ChartSection.tsx    # (Already exists)
│   │   ├── OrderBook.tsx       # (Already exists)
│   │   ├── TradingForm.tsx     # (Already exists)
│   │   ├── AssetsTable.tsx     # (Already exists - maybe rename to PositionsTable?)
│   │   ├── RecentTrades.tsx
│   │   ├── PriceOverview.tsx   # (Already exists)
│   │   └── TradingSidebar.tsx  # (Already exists)
│   │
│   ├── profile/            # Components specific to the User Profile/Settings pages
│   │   ├── AccountInfo.tsx     # (Already exists)
│   │   ├── ApiKeysManager.tsx
│   │   ├── SecuritySettings.tsx
│   │   └── ProfileLayout.tsx   # (Already exists)
│   │
│   ├── bots/               # Components specific to the Trading Bots feature (Future)
│   │   ├── BotCard.tsx         # (Already exists)
│   │   ├── BotConfigurationForm.tsx
│   │   └── BotPerformance.tsx
│   │
│   └── earn/               # Components specific to the Earn/Staking feature (Future)
│       ├── StakingOptionCard.tsx
│       └── RewardHistory.tsx
│
├── hooks/                  # Custom React Hooks
│   └── ...
│
├── lib/                    # Utility functions, constants, type definitions
│   └── ...
│
├── pages/                  # Page-level components assembling feature components
│   ├── Dashboard.tsx
│   ├── Terminal.tsx
│   ├── Profile.tsx
│   ├── Bots.tsx
│   ├── Earn.tsx
│   └── ...
│
└── App.tsx                 # Main application component, routing setup
```

## Key Component Types

1.  **UI Primitives (`components/ui/`):** Base building blocks like Buttons, Inputs, Cards, etc. Primarily uses shadcn/ui components. Should be stateless and highly reusable.
2.  **Layout Components (`components/layout/`):** Define the overall structure of pages (Navbar, Footer, Sidebars).
3.  **Common Components (`components/common/`):** Reusable components used across multiple features but more complex than UI primitives (e.g., selectors, data display elements).
4.  **Feature Components (`components/<feature>/`):** Components specific to a particular feature area (Dashboard, Terminal, Profile). These might contain their own state and logic related to the feature.
5.  **Page Components (`pages/`):** Top-level components for each route/page. Responsible for fetching page-specific data and assembling layout and feature components.

---
*This structure provides a starting point and can be adapted as the application grows.*