# Terminal Components

This directory contains components used in the trading terminal interface.

## TradingView Chart Implementation

The TradingView chart is implemented using the following component hierarchy:

1. **ChartSection.tsx** - The main chart component that includes the trading pair selector, price overview, and timeframe selector. It uses TradingViewContainer for the actual chart.

2. **TradingViewContainer.tsx** - A wrapper component that handles loading states, errors, and fallback logic for the TradingView chart. It renders the TradingViewWidget.

3. **TradingViewWidget.jsx** - The core implementation that uses the TradingView Advanced Chart widget with the embed-widget-advanced-chart.js approach. This component is responsible for configuring and rendering the TradingView chart.

### Implementation Details

- The TradingView chart is implemented using the embed-widget-advanced-chart.js approach, which is the recommended method for embedding the TradingView Advanced Chart widget.
- Drawing tools are enabled with `"drawings_access": { "type": "all" }` in the widget configuration.
- The chart uses the default Volume indicator that comes with the TradingView Advanced Chart widget.
- The drawing toolbar is visible in fullscreen mode with `"side_toolbar_in_fullscreen_mode"` in the enabled_features array.
- Drawing templates are enabled with `"drawing_templates"` in the enabled_features array.
- The built-in TradingView timeframe selector is enabled with `"withdateranges": true` in the widget configuration.
- The TradingView copyright link and fallback chart button have been removed to maximize chart space.

### Fallback Mechanism

If the TradingView chart fails to load, a custom fallback chart is displayed using the FallbackChart component. This ensures that users always have a chart to view, even if the TradingView widget fails to load.

### Notes for Developers

- If you need to modify the TradingView chart configuration, edit the TradingViewWidget.jsx file.
- Avoid creating new implementations of the TradingView chart to prevent redundancy.
- If you need to reference alternative implementations, check the backup directory.
