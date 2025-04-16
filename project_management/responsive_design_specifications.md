# Responsive Design Specifications

This document outlines the specifications and strategy for ensuring the OpenTrade platform is responsive across different screen sizes.

## Goal

Provide a usable and aesthetically pleasing experience primarily on desktop devices, while ensuring core functionality remains accessible on smaller screens like tablets and potentially mobile (though mobile optimization is a secondary goal for Phase 1).

## Approach

- **Desktop-First (with Mobile Considerations):** Given the complexity of interfaces like the Trading Terminal, the primary design target is desktop. However, responsive modifiers will be used to adapt layouts for smaller screens where feasible. We will primarily use Tailwind's default breakpoints.
- **Tailwind CSS:** Responsiveness will be implemented using Tailwind CSS's responsive modifiers (e.g., `sm:`, `md:`, `lg:`, `xl:`) applied to utility classes.

## Breakpoints

We will use Tailwind CSS's default breakpoints:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

_(Note: The `container` class has a custom `2xl` setting of `1400px` in `tailwind.config.ts`, but general responsive utilities will use the defaults)._

## Layout Adaptations

### 1. Global Navigation (`Navbar`)

- **Desktop (`lg` and up):** Display full navigation links horizontally.
- **Tablet/Mobile (`md` and below):** Collapse navigation links into a hamburger menu icon. Clicking the icon should open a drawer or dropdown menu containing the navigation links.

### 2. Trading Terminal (`/terminal`)

- **Desktop (`xl` and up):** Maintain the three-column layout (Sidebar, Chart, Market Info).
- **Large Tablet (`lg` to `xl`):** Consider slightly reducing padding or margins. The three columns might remain, but their relative widths could adjust.
- **Tablet (`md` to `lg`):** This is challenging. Potential strategies:
  - **Stacking:** Stack the three main sections vertically (e.g., Trading Sidebar, then Chart, then Market Info). The bottom panel (Positions/Orders) would remain below.
  - **Tabbed Interface:** Keep the Chart prominent, and move Sidebar/Market Info into collapsible side panels or tabs.
  - _(Decision needed during implementation based on usability testing)_.
- **Mobile (`sm` and below):** Likely unusable in its full complexity. A simplified view might be necessary, potentially focusing only on placing simple orders or viewing basic chart/price info. Full terminal functionality might be explicitly marked as "desktop recommended".

### 3. Dashboard (`/dashboard`)

- **Desktop (`lg` and up):** Display widgets in a grid layout (e.g., 2-3 columns).
- **Tablet (`md` to `lg`):** Adjust grid to fewer columns (e.g., 2 columns).
- **Mobile (`sm` and below):** Stack widgets vertically (1 column). Ensure charts within widgets resize appropriately.

### 4. Other Pages (Profile, Bots, Earn)

- Follow standard responsive patterns. Forms and content sections should stack vertically on smaller screens. Sidebars (like in Profile) might become top tabs or collapsible drawers.

## Component Adaptations

- Individual components should use responsive modifiers as needed for:
  - **Text Size:** e.g., `text-lg lg:text-xl`
  - **Padding/Margin:** e.g., `p-4 md:p-6`
  - **Layout within Component:** e.g., `flex flex-col md:flex-row`
  - **Visibility:** e.g., `hidden lg:block` (for elements only shown on larger screens)
- **Tables:** Tables containing multiple columns might require horizontal scrolling on smaller screens or be adapted into a card-per-row format.

## Testing

- Responsiveness should be tested during development using browser developer tools (device mode).
- Testing on actual tablet/mobile devices is recommended before major releases.

---

_These specifications provide a general guideline. Specific implementation details will be addressed on a page-by-page and component-by-component basis._
