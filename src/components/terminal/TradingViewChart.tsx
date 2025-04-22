import { useEffect, useRef } from 'react';
import { TradingPair } from '@/types/trading';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';

// Map exchange IDs to TradingView exchange symbols
const EXCHANGE_TO_TRADINGVIEW_MAP: Record<string, string> = {
  binance: 'BINANCE',
  coinbase: 'COINBASE',
  kraken: 'KRAKEN',
  kucoin: 'KUCOIN',
  bybit: 'BYBIT',
  okx: 'OKX',
  // Add more exchanges as needed
  // Default to BINANCE if not found
};

// Extend the Window interface to include TradingView
declare global {
  interface Window {
    TradingView?: any;
  }
}

interface TradingViewChartProps {
  selectedPair?: TradingPair;
  timeframe: string;
}

export function TradingViewChart({
  selectedPair,
  timeframe,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedAccount } = useSelectedAccount();

  // Get the correct symbol format for TradingView
  const getSymbol = (): string => {
    if (!selectedPair) return 'BINANCE:BTCUSDT';

    let baseAsset = selectedPair.baseAsset.toUpperCase();
    const quoteAsset = selectedPair.quoteAsset.toUpperCase();

    // Get exchange ID from pair or account
    const exchangeId = (
      selectedPair.exchangeId ||
      (selectedAccount ? selectedAccount.exchangeId : 'binance')
    ).toLowerCase();

    // Map to TradingView exchange format
    const exchange = EXCHANGE_TO_TRADINGVIEW_MAP[exchangeId] || 'BINANCE';

    // Special case for Kraken BTC pairs (Kraken uses XBT instead of BTC)
    if (exchangeId === 'kraken' && baseAsset === 'BTC') {
      console.log('Using XBT instead of BTC for Kraken');
      baseAsset = 'XBT';
    }

    // Special case for CRYPTOCAP (Total Market Cap)
    if (baseAsset === 'CRYPTOCAP') {
      return 'CRYPTOCAP:TOTAL';
    }

    // Exchange-specific mappings for common pairs
    const pairKey = `${exchangeId}:${baseAsset}/${quoteAsset}`;
    const exchangeSpecificPairs: Record<string, string> = {
      'kraken:BTC/USD': 'KRAKEN:XBTUSD',
      'kraken:BTC/USDT': 'KRAKEN:XBTUSDT',
      'kraken:ETH/USD': 'KRAKEN:ETHUSD',
    };

    if (exchangeSpecificPairs[pairKey]) {
      return exchangeSpecificPairs[pairKey];
    }

    // Create the explicit symbol format
    return `${exchange}:${baseAsset}${quoteAsset}`;
  };

  // Create or update the widget when dependencies change
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear the container
    containerRef.current.innerHTML = '';

    // Get the symbol
    const symbol = getSymbol();
    console.log(
      `Creating TradingView widget with symbol: ${symbol}, timeframe: ${timeframe}`,
    );

    // Create a unique container ID
    const containerId = `tradingview_chart_${Date.now()}`;
    containerRef.current.id = containerId;

    // Define a function to create the TradingView widget
    const createWidget = () => {
      if (typeof window.TradingView === 'undefined') {
        console.error('TradingView is not defined');
        return;
      }

      // Make sure the container still exists
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container with ID ${containerId} not found`);
        return;
      }

      try {
        new window.TradingView.widget({
          width: '100%',
          height: '100%',
          symbol: symbol,
          interval: timeframe,
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#131722',
          enable_publishing: false,
          hide_top_toolbar: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          save_image: false,
          container_id: containerId,
          studies: ['Volume@tv-basicstudies'],
          disabled_features: [
            'header_symbol_search',
            'header_compare',
            'header_undo_redo',
            'header_screenshot',
            'use_localstorage_for_settings',
          ],
          enabled_features: [
            'side_toolbar_in_fullscreen_mode',
            'disable_resolution_rebuild',
          ],
        });
        console.log(`TradingView widget created with symbol: ${symbol}`);
      } catch (e) {
        console.error('Error creating TradingView widget:', e);
      }
    };

    // First load the TradingView widget script if needed
    if (!document.getElementById('tradingview-widget-script')) {
      const tvScript = document.createElement('script');
      tvScript.id = 'tradingview-widget-script';
      tvScript.src = 'https://s3.tradingview.com/tv.js';
      tvScript.async = true;
      tvScript.onload = () => {
        // Once TradingView is loaded, create the widget
        setTimeout(createWidget, 100); // Small delay to ensure DOM is ready
      };
      document.head.appendChild(tvScript);
    } else {
      // TradingView script already loaded, create the widget
      setTimeout(createWidget, 100); // Small delay to ensure DOM is ready
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [selectedPair, timeframe, selectedAccount]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ backgroundColor: '#131722' }}
    />
  );
}
