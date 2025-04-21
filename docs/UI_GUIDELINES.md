# OmniTrade UI Guidelines

This document outlines the essential UI/UX guidelines for the OmniTrade platform. For more comprehensive guidelines, please visit our [GitHub Wiki](https://github.com/yourusername/omnitrade/wiki/UI-UX-Guidelines).

## Design Principles

1. **Clarity**: Information should be presented clearly and concisely
2. **Efficiency**: UI elements should be compact and optimized for power users
3. **Consistency**: Similar elements should look and behave similarly
4. **Responsiveness**: The UI should adapt to different screen sizes

## Color Scheme

### Protected Layer Pages

- **Background**: Dark theme with dark gray backgrounds
- **Text**: Gray font colors for better readability
- **Accents**: Purple for highlights and active elements
- **Charts**: 
  - Uptrend: Neon green (#00FF00)
  - Downtrend: Red (#FF0000)

## Layout Guidelines

- **Compact Design**: Minimal padding to maximize screen real estate
- **Resizable Borders**: Allow users to resize panels
- **No White Borderlines**: Avoid white borders between elements
- **No Duplicate Buttons**: Eliminate redundant controls

### Terminal Layout

- **Trading Column**: Smaller column on the left
- **Assets Section**: Cover all the way to the left
- **Order Book**: Cover the entire right side of the terminal screen
- **Trading Sidebar**: Wide enough to fit market, limit, and stop tabs
- **Chart and Sidebar**: Group together as an inseparable responsive unit

## Component Guidelines

### Charts

- **Height**: Charts should be 30% taller and 10% narrower than default
- **Style**: Use jagged lines and natural curve types
- **Alignment**: Align to the bottom right of cards
- **Y-axis**: Start scaling at lower values
- **X-axis**: Align time intervals with the edge of cards
- **Time Labels**: Show 7-day intervals with larger font sizes (1.5x bigger)
- **Sample Rate**: Use higher sample rates for better visualization

### Trading Interface

- **Pair Selection**: Place above the TradingView widget
- **Price Display**: Position next to the pair selector, color-coded
- **Order Book**: Slightly wider with buy/sell wall volume visualization
- **Balance Display**: Show only the user's balance of the chosen trading pair
- **Tab Highlighting**: Use underline purple highlights instead of tabs

## Component Library

We use a custom component library based on Tailwind CSS and shadcn/ui. Key components include:

### Layout Components

- **Card**: Container for content with consistent styling
- **Panel**: Resizable container for application sections
- **Grid**: Responsive grid layout system

### Form Components

- **Button**: Primary, secondary, and tertiary button styles
- **Input**: Text input with validation
- **Select**: Dropdown selection component
- **Checkbox**: Toggle for boolean options

### Data Display Components

- **Table**: Display tabular data with sorting and filtering
- **Chart**: Visualize data in various chart types
- **Badge**: Display status or category information

## Implementation Notes

- **CSS Framework**: Tailwind CSS for utility-first styling
- **Component Library**: shadcn/ui for base components
- **Icons**: Use Lucide icons for consistency
- **Animations**: Keep animations subtle and performance-friendly

For more detailed UI/UX guidelines, please visit our [GitHub Wiki](https://github.com/yourusername/omnitrade/wiki/UI-UX-Guidelines).
