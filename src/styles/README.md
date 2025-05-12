# OmniTrade Terminal Global Styling System

This document outlines the global styling system for the OmniTrade Terminal application.

## Overview

The OmniTrade Terminal styling system is built on:
- **Tailwind CSS** as the utility-first CSS framework
- **CSS Variables** for theming and consistent values
- **shadcn/ui** components with custom theming
- **Global utility classes** for common styling patterns

## Theme System

The application supports both light and dark themes, controlled through the `ThemeProvider` component.

### Theme Variables

All theme variables are defined in `src/styles/theme-variables.css` and follow this naming convention:
- `--bg-*` for background colors
- `--text-*` for text colors
- `--border-*` for border colors
- `--button-*` for button colors
- `--crypto-*` for cryptocurrency-specific colors

### Using Theme Variables

Theme variables should be accessed through Tailwind classes when possible:
- Use `bg-background` instead of setting `background-color: var(--bg-primary)`
- Use `text-primary` instead of setting `color: var(--text-primary)`

For cases where Tailwind classes aren't sufficient, use the utility classes defined in `theme-utilities.css`.

## Component Styling

Components should follow these guidelines:
1. Use Tailwind utility classes for styling
2. Use theme variables for colors, spacing, and typography
3. Follow the component patterns established in the UI library

### Example Component

```tsx
import { Button } from "@/components/ui/button";

export function ExampleComponent() {
  return (
    <div className="bg-card p-4 rounded-lg border border-border">
      <h3 className="text-lg font-medium text-card-foreground mb-2">Example Component</h3>
      <p className="text-muted-foreground mb-4">This is an example of a properly styled component.</p>
      <Button variant="default">Primary Action</Button>
    </div>
  );
}
```

## Utility Classes

Common styling patterns are available as utility classes in `theme-utilities.css`:
- `.bg-theme-*` classes for themed backgrounds
- `.text-theme-*` classes for themed text colors
- `.border-theme-*` classes for themed borders

## File Structure

- `src/index.css` - Main CSS file with Tailwind imports
- `src/styles/theme-variables.css` - All theme variables
- `src/styles/theme-utilities.css` - Utility classes for theme variables
- `src/styles/theme-transitions.css` - Transition effects for theme changes
- `src/styles/components.css` - Component-specific styles
- `src/styles/crypto-colors.css` - Cryptocurrency-specific colors

## Best Practices

1. **Consistency**: Use the established color palette and spacing scale
2. **Responsiveness**: Design components to work on all screen sizes
3. **Accessibility**: Ensure sufficient color contrast and keyboard navigation
4. **Performance**: Minimize custom CSS in favor of utility classes
