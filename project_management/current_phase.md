---
### Assistant Startup Instruction

**At the start of every session or when resuming a task, you must:**

- **Read the current phase and next step from this file.**
- **Provide the user with a brief summary of the current project status.**
- **Explain the next step in simple, easy-to-understand language.**
- **Outline a clear, step-by-step plan to accomplish the next step.**

---

# Current Project Phase

The API and WebSocket review for the Market Data integration has been completed. All relevant endpoints, event schemas, and authentication requirements have been analyzed using `market_data_api_openapi.yaml` and `market_data_websocket.md`. This review ensures a clear understanding of the data flow and technical requirements for real-time and RESTful market data features.

---

## Next Step

**Select and configure state management, data fetching, and WebSocket client libraries**

The immediate next focus is to:
- Evaluate and choose libraries for state management (e.g., Zustand), data fetching (e.g., React Query), and WebSocket connectivity (e.g., Reconnecting WebSocket).
- Install the selected libraries.
- Begin configuring the project structure to support robust, real-time market data integration.

This step will lay the technical foundation for implementing the Market Data API and WebSocket features in the frontend.
