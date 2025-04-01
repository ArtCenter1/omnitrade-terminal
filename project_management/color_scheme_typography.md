# Color Scheme and Typography Definition

This document defines the base color scheme and typography for the OpenTrade platform, primarily based on the defaults provided by `shadcn/ui` and Tailwind CSS.

## Typography

*   **Font Family:** The application uses Tailwind CSS's default **sans-serif** font stack. This stack prioritizes system fonts for optimal rendering across different operating systems.
    *   *Stack Example:* `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`
*   **Base Font Size:** Tailwind's default base font size is `16px` (rendered as `1rem`). Component font sizes are typically relative to this base using Tailwind's type scale utilities (e.g., `text-sm`, `text-lg`, `text-xl`).
*   **Font Weights:** Standard Tailwind font weight utilities apply (e.g., `font-normal`, `font-medium`, `font-semibold`, `font-bold`).

## Color Scheme (Default Dark Theme)

The color scheme is defined using CSS variables in `src/index.css`, allowing for potential theming (e.g., adding a light theme) later by redefining these variables within a different scope (e.g., a `.light` class on the `body`).

The core color variables (defined using HSL format: `Hue Saturation% Lightness%`) are:

*   `--background`: `240 10% 3.9%` (Very dark blue/gray)
*   `--foreground`: `0 0% 98%` (Near white)
*   `--card`: `240 10% 3.9%` (Same as background)
*   `--card-foreground`: `0 0% 98%` (Same as foreground)
*   `--popover`: `240 10% 3.9%` (Same as background)
*   `--popover-foreground`: `0 0% 98%` (Same as foreground)
*   `--primary`: `267 100% 81%` (Bright purple/violet)
*   `--primary-foreground`: `240 5.9% 10%` (Dark gray for text on primary)
*   `--secondary`: `240 3.7% 15.9%` (Dark gray/blue)
*   `--secondary-foreground`: `0 0% 98%` (Near white for text on secondary)
*   `--muted`: `240 3.7% 15.9%` (Same as secondary)
*   `--muted-foreground`: `240 5% 64.9%` (Medium gray for muted text)
*   `--accent`: `240 3.7% 15.9%` (Same as secondary - potentially redefine for a distinct accent)
*   `--accent-foreground`: `0 0% 98%` (Near white for text on accent)
*   `--destructive`: `0 62.8% 30.6%` (Dark red)
*   `--destructive-foreground`: `0 0% 98%` (Near white for text on destructive)
*   `--border`: `240 3.7% 15.9%` (Same as secondary)
*   `--input`: `240 3.7% 15.9%` (Same as secondary)
*   `--ring`: `240 4.9% 83.9%` (Light gray/blue for focus rings)

Additionally, specific semantic colors are defined in `tailwind.config.ts`:

*   `crypto.red`: `#ea384d`
*   `crypto.green`: `#05c48a`
*   `crypto.purple`: `#9b87f5`
*   `crypto.yellow`: `#f3ba2f`

## Usage

These colors and typography settings are applied automatically through Tailwind CSS utility classes and the base styles provided for `shadcn/ui` components. Consistency is maintained by using Tailwind utilities (e.g., `bg-background`, `text-primary`, `font-semibold`, `text-lg`) rather than hardcoding styles.

---
*This definition reflects the current state based on `shadcn/ui` defaults. Colors and fonts can be customized further by modifying `src/index.css` and `tailwind.config.ts`.*