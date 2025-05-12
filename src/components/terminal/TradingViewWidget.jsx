import React, { useEffect, useRef, memo } from 'react';
import { useTheme } from 'next-themes';

function TradingViewWidget({ selectedPair }) {
  const container = useRef();
  const { theme } = useTheme();

  // Get the default interval (daily)
  const getInterval = () => {
    return 'D'; // Default to daily
  };

  // Get the correct symbol format for TradingView
  const getSymbol = () => {
    // Default to a common symbol that's guaranteed to work
    if (!selectedPair) return 'BINANCE:BTCUSDT';

    const baseAsset = selectedPair.baseAsset.toUpperCase();
    const quoteAsset = selectedPair.quoteAsset.toUpperCase();
    const exchangeId = (selectedPair.exchangeId || 'binance').toLowerCase();

    // Map exchange IDs to TradingView exchange symbols
    const exchangeMap = {
      binance: 'BINANCE',
      coinbase: 'COINBASE',
      kraken: 'KRAKEN',
      kucoin: 'KUCOIN',
      bybit: 'BYBIT',
      okx: 'OKX',
    };

    const exchange = exchangeMap[exchangeId] || 'BINANCE';
    return `${exchange}:${baseAsset}${quoteAsset}`;
  };

  useEffect(() => {
    // Clear previous content
    if (container.current) {
      container.current.innerHTML = `
        <div class="tradingview-widget-container__widget" style="height: 100%; width: 100%"></div>
      `;
    }

    // Create and add the script
    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;

    // Get the symbol and interval
    const symbol = getSymbol();
    const interval = getInterval();

    // Get the current theme (light or dark)
    const currentTheme = theme === 'light' ? 'light' : 'dark';

    // Set the toolbar background color based on theme
    const toolbarBg = theme === 'light' ? 'rgba(245, 245, 250, 1)' : 'rgba(19, 23, 34, 1)';

    // Configure the widget
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "${symbol}",
        "interval": "${interval}",
        "timezone": "Etc/UTC",
        "theme": "${currentTheme}",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "${toolbarBg}",
        "enable_publishing": false,
        "hide_top_toolbar": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "save_image": false,
        "support_host": "https://www.tradingview.com",
        "drawings_access": { "type": "all" },
        "show_popup_button": true,
        "popup_width": "1000",
        "popup_height": "650",
        "withdateranges": true,
        "enabled_features": [
          "side_toolbar_in_fullscreen_mode",
          "drawing_templates"
        ],
        "disabled_features": [
          "header_symbol_search",
          "header_compare",
          "header_undo_redo",
          "header_screenshot",
          "use_localstorage_for_settings",
          "header_settings",
          "header_chart_type",
          "header_indicators",
          "header_saveload",
          "header_fullscreen_button"
        ]
      }`;

    // Add the script to the container
    container.current.appendChild(script);

    // Cleanup function
    return () => {
      if (container.current) {
        // Remove all children
        while (container.current.firstChild) {
          container.current.removeChild(container.current.firstChild);
        }
      }
    };
  }, [selectedPair, theme]); // Re-run when selectedPair or theme changes

  return (
    <div
      className="tradingview-widget-container theme-transition"
      ref={container}
      style={{ height: '100%', width: '100%' }}
    >
      <div
        className="tradingview-widget-container__widget theme-transition"
        style={{ height: '100%', width: '100%' }}
      ></div>
    </div>
  );
}

export default memo(TradingViewWidget);
