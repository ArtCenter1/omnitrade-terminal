import React, { useEffect, useRef, memo } from 'react';

function TradingViewWidget({ selectedPair, timeframe }) {
  const container = useRef();

  // Map timeframe to TradingView interval
  const getInterval = () => {
    switch (timeframe) {
      case '1':
        return '1';
      case '5':
        return '5';
      case '15':
        return '15';
      case '30':
        return '30';
      case '60':
        return '60';
      case '240':
        return '240';
      case 'D':
        return 'D';
      case 'W':
        return 'W';
      default:
        return 'D'; // Default to daily
    }
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
        <div class="tradingview-widget-container__widget" style="height: calc(100% - 32px); width: 100%"></div>
        <div class="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank"><span class="blue-text">Track all markets on TradingView</span></a></div>
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

    // Configure the widget
    script.innerHTML = `
      {
        "autosize": true,
        "symbol": "${symbol}",
        "interval": "${interval}",
        "timezone": "Etc/UTC",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#131722",
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
        "studies": ["Volume@tv-basicstudies"],
        "enabled_features": [
          "side_toolbar_in_fullscreen_mode",
          "drawing_templates"
        ],
        "disabled_features": [
          "header_symbol_search",
          "header_compare",
          "header_undo_redo",
          "header_screenshot",
          "use_localstorage_for_settings"
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
  }, [selectedPair, timeframe]); // Re-run when selectedPair or timeframe changes

  return (
    <div
      className="tradingview-widget-container"
      ref={container}
      style={{ height: '100%', width: '100%' }}
    >
      <div
        className="tradingview-widget-container__widget"
        style={{ height: 'calc(100% - 32px)', width: '100%' }}
      ></div>
      <div className="tradingview-widget-copyright">
        <a
          href="https://www.tradingview.com/"
          rel="noopener nofollow"
          target="_blank"
        >
          <span className="blue-text">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
}

export default memo(TradingViewWidget);
