---
### Assistant Startup Instruction

**At the start of every session or when resuming a task, you must:**

- **Read the current phase and next step from this file.**
- **Review the design checkpoint document (`design_checkpoint.md`) for relevant sections.**
- **Provide the user with a brief summary of the current project status.**
- **Explain the next step in simple, easy-to-understand language.**
- **Outline a clear, step-by-step plan to accomplish the next step.**
- **Highlight any design checkpoint considerations relevant to the current task.**

---

# Current Project Phase

The project is now in the "Frontend-Backend Integration" phase. The primary focus is connecting the core frontend components—User Profile/Settings, Dashboard, and Terminal—to the backend services. This phase aims to enable seamless data flow and user interaction across the application.

Detailed tasks and progress for this phase are tracked in [`frontend_backend_integration_checklist.md`](./frontend_backend_integration_checklist.md).

## Binance Testnet Integration

The Binance Testnet integration with our existing Sandbox mode is progressing well. Phase 1 (Setup & Authentication) is nearly complete, with successful connection to the Binance Testnet API and implementation of rate limit handling. This integration provides a real matching engine for testing without having to implement a custom solution. The next phase will focus on order placement testing.

Detailed plan and progress for this initiative are tracked in:

- [`binance-testnet-integration-master-plan.md`](./binance-testnet-integration-master-plan.md)

---

## Next Step

Bot Execution Engine Implementation
The Bot Execution Engine is the next phase in our project. The primary focus is on developing a robust system for executing and managing bots.
1.Design bot execution architecture
**For Binance Testnet Integration**: We have successfully completed REST API Market Data Integration (Phase 2) including exchange information, trading pairs, order book, recent trades, and candlestick data endpoints. The next step is to implement WebSocket connections for real-time market data as outlined in the Next Steps section of the master plan.

---

## Design Checkpoint Integration

A new design checkpoint process has been implemented to ensure consistency and best practices across the project. Before starting work on any component:

1. Review the `design_checkpoint.md` document for relevant sections
2. Follow the process outlined in `design_checkpoint_workflow.md`
3. Use the pre-implementation checklist to verify your approach

This is especially important for exchange connectivity and API key management, which have specific security and architectural considerations outlined in the checkpoint document.

---

## Upcoming Onboarding Experience

A comprehensive onboarding experience has been added to the roadmap after the Redis Cloud Setup. This will combine:

1. A sandbox/demo environment for risk-free exploration
2. Guided tutorials using react-joyride
3. An AI-driven assistant with voice and animations
4. Guided setup wizard for Binance Testnet API keys

This solution will improve user retention and provide a better first-time experience while supporting bot building and backtesting features. The Binance Testnet API key setup wizard has been moved from the Binance Testnet integration plan to this onboarding experience to provide a more integrated user experience. See `onboarding_experience.md` for details.
