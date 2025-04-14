# UI Component Library Design

This document outlines the design approach for the UI component library used in the OpenTrade platform.

## Base Library: shadcn/ui

- **Foundation:** The primary foundation for our UI components is **shadcn/ui**. We leverage its collection of beautifully designed, unstyled components built on Radix UI and styled with Tailwind CSS.
- **Component Addition:** New base components (like buttons, inputs, dialogs, cards, etc.) should preferably be added using the `shadcn-ui` CLI (`npx shadcn-ui@latest add [component]`). This ensures they are integrated correctly into the project structure (`src/components/ui/`) and can receive potential future updates.
- **Customization:** Styling customization should primarily be done through Tailwind CSS utility classes applied directly where the components are used, or by modifying the base component files within `src/components/ui/` if global style changes are needed for a specific shadcn component. Theme-level changes (colors, fonts, spacing) should be configured in `tailwind.config.ts`.

## Custom & Composed Components

- **Necessity:** Custom components will be created when:
  - A required UI element is not available in `shadcn/ui`.
  - A significant composition of multiple `shadcn/ui` or base HTML elements is frequently reused across the application with specific logic or layout.
  - A highly specialized component is needed for a specific feature (e.g., a custom chart interaction element).
- **Structure:** Custom and composed components should follow the directory structure outlined in `project_management/component_structure.md`:
  - **`src/components/common/`:** For reusable components not tied to a single feature (e.g., `MarketSelector`, `AssetIcon`).
  - **`src/components/<feature>/`:** For components specific to a feature area (e.g., `terminal/TradingForm`, `dashboard/PortfolioOverview`).
- **Design Principles:**
  - **Reusability:** Design custom components with reusability in mind where appropriate.
  - **Props API:** Define clear and well-typed (TypeScript) props interfaces.
  - **Composition:** Build complex components by composing simpler ones (including `shadcn/ui` components).
  - **Consistency:** Ensure custom components match the overall visual style and interaction patterns established by the base `shadcn/ui` library and the application's theme.

## Development Process

1.  **Identify Need:** Determine if a new UI element or composition is required.
2.  **Check `shadcn/ui`:** Verify if a suitable component exists in `shadcn/ui`. If yes, use or add it via the CLI.
3.  **Design Custom (If Needed):** If no suitable base component exists, design the custom component's API (props) and structure.
4.  **Implement:** Build the component using React, TypeScript, and Tailwind CSS, composing `shadcn/ui` components where possible.
5.  **Place:** Store the component in the appropriate directory based on its scope (common, feature-specific).
6.  **Document (If Complex):** Add comments or potentially Storybook stories (if Storybook is added later) for complex custom components.

---

_This document confirms `shadcn/ui` as the base library and sets guidelines for creating additional components._
