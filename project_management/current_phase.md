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

---

## Next Step

**Implement backend API endpoints for user exchange API key management**

The first actionable step is to design and build backend API endpoints for managing user exchange API keys. This includes functionality to add, list, delete, and test connection/credentials for exchange API keys. These endpoints do not currently exist and must be implemented from scratch.

This foundational work will enable secure integration between user accounts and external exchanges, supporting future trading and data features.

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

This solution will improve user retention and provide a better first-time experience while supporting bot building and backtesting features. See `onboarding_experience.md` for details.
