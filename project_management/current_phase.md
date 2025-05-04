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

The project is now in "Phase 1: Core Terminal Foundation" of our new roadmap. We are focusing on building the foundational architecture for the OmniTrade Terminal as a standalone application with a modular plugin system.

## Current Focus Areas

### Terminal Architecture Design
We are currently designing the component registry system and workspace layout management that will form the foundation of our plugin-based architecture.

### Core Terminal UI Development
Work has begun on implementing the responsive terminal container and designing the drag-and-drop workspace management system.

### Essential Terminal Components
Planning and initial implementation of core trading components including chart integration, order book visualization, and order entry forms.

## Next Steps

1. Complete the terminal architecture design
2. Implement the core UI framework with component slots
3. Develop essential terminal components
4. Build the data service layer interfaces

Our goal is to reach Milestone 1 (Core Terminal MVP) by week 6, which includes basic workspace management, essential terminal components, and market data integration.

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
