# Notes: Multi-User Strategy Comparison Chart

**Goal:** Visualize the performance (cumulative PnL) of the user's trading bot strategy against multiple other users' strategies over a defined period (e.g., 6 months) using a time-progression replay animation.

**Current State:**

- Implemented a basic 1v1 comparison chart in `src/components/community/ChallengeSimulationGraph.tsx` using `recharts`.
- Updated the chart to use sample cumulative PnL data based on provided monthly figures for the user and one opponent.

**Next Steps (Paused):** Implement comparison against multiple users.

**Open Questions to Revisit:**

1.  **Data Source:** Where will the historical PnL data for _all_ relevant users come from (e.g., API endpoint, central state, props)?
2.  **Component Location:** Should this feature:
    - Replace the current 1v1 chart in `ChallengeSimulationGraph.tsx`?
    - Be integrated into `OverallPerformanceGraph.tsx`?
    - Be implemented as a new, dedicated component (e.g., `StrategyComparisonChart.tsx`)?
3.  **Scope of Comparison:** How many opponents should be displayed simultaneously? (e.g., Top 5, Top 10, all users on the leaderboard, user-selectable opponents)?
4.  **Animation Priority:** Is the "replay" animation effect essential for the initial version, or can it be added as a later enhancement?

**Sample Data Used for 1v1:**

- User Monthly PnL: `[-12, 25, 40, 60, 120, 25]`
- Opponent Monthly PnL: `[-20, -50, 19, 47, 125, 200]`

**(End of Notes)**
