# Backup of Redundant TradingView Implementations

This directory contains backup copies of redundant TradingView chart implementations that were removed from the main codebase to reduce redundancy and improve maintainability.

## Files

1. **TradingViewChart.tsx** - An implementation using the tv.js approach. This was not being used in the application.

2. **TradingViewAdvancedChart.tsx** - Another implementation using the tv.js approach. This was not being used in the application.

3. **ChartSection.tsx.new** - A new version of ChartSection that directly implements TradingView functionality instead of using TradingViewContainer. This was not being used.

4. **TimeframeSelector.tsx** - A custom timeframe selector component that was replaced by the built-in TradingView timeframe selector.

## Current Implementation

The current active implementation uses:

- **TradingViewWidget.jsx** - The main implementation using the embed-widget-advanced-chart.js approach
- **TradingViewContainer.tsx** - A wrapper component that renders the TradingViewWidget and handles loading states and errors
- **ChartSection.tsx** - The main chart component that uses TradingViewContainer

## Why These Files Were Moved

These files were moved to reduce redundancy in the codebase and prevent confusion for developers. Having multiple implementations of the same functionality can lead to maintenance issues and inconsistencies.

If you need to reference these implementations for any reason, they are preserved here rather than being completely deleted.

## Date of Cleanup

This cleanup was performed on: $(date)
