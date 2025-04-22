import { useEffect, useRef, useState } from 'react';
import { TradingPair } from '@/types/trading';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { useFeatureFlags } from '@/config/featureFlags';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
  const { useMockData } = useFeatureFlags();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get the correct symbol format for TradingView
  const getSymbol = (): string => {
    // Default to a common symbol that's guaranteed to work
    if (!selectedPair) return 'BINANCE:BTCUSDT';

    let baseAsset = selectedPair.baseAsset.toUpperCase();
    const quoteAsset = selectedPair.quoteAsset.toUpperCase();

    // Get exchange ID from pair or account
    const exchangeId = (
      selectedPair.exchangeId ||
      (selectedAccount ? selectedAccount.exchangeId : 'binance')
    ).toLowerCase();

    // If we're using mock data or the backend is down, default to BINANCE for better compatibility
    const exchange = useMockData
      ? 'BINANCE'
      : EXCHANGE_TO_TRADINGVIEW_MAP[exchangeId] || 'BINANCE';

    // Special case for Kraken BTC pairs (Kraken uses XBT instead of BTC)
    // Only apply this for real Kraken data, not when using mock data
    if (!useMockData && exchangeId === 'kraken' && baseAsset === 'BTC') {
      console.log('Using XBT instead of BTC for Kraken');
      baseAsset = 'XBT';
    }

    // Special case for CRYPTOCAP (Total Market Cap)
    if (baseAsset === 'CRYPTOCAP') {
      return 'CRYPTOCAP:TOTAL';
    }

    // Exchange-specific mappings for common pairs
    // Only use these mappings when not using mock data
    if (!useMockData) {
      const pairKey = `${exchangeId}:${baseAsset}/${quoteAsset}`;
      const exchangeSpecificPairs: Record<string, string> = {
        'kraken:BTC/USD': 'KRAKEN:XBTUSD',
        'kraken:BTC/USDT': 'KRAKEN:XBTUSDT',
        'kraken:ETH/USD': 'KRAKEN:ETHUSD',
      };

      if (exchangeSpecificPairs[pairKey]) {
        return exchangeSpecificPairs[pairKey];
      }
    }

    // When using mock data, always use BINANCE for better compatibility
    if (useMockData) {
      return `BINANCE:${baseAsset}${quoteAsset}`;
    }

    // Create the explicit symbol format
    return `${exchange}:${baseAsset}${quoteAsset}`;
  };

  // Create or update the widget when dependencies change
  useEffect(() => {
    if (!containerRef.current) return;

    setIsLoading(true);
    setError(null);

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
        setError('Unable to load TradingView chart library');
        setIsLoading(false);
        return;
      }

      // Make sure the container still exists
      const container = document.getElementById(containerId);
      if (!container) {
        console.error(`Container with ID ${containerId} not found`);
        setError('Chart container not found');
        setIsLoading(false);
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
          // Add an onChartReady callback to know when the chart is loaded
          onChartReady: () => {
            console.log('TradingView chart is ready');
            setIsLoading(false);
          },
        });
        console.log(`TradingView widget created with symbol: ${symbol}`);

        // Set a timeout to detect if the chart fails to load
        setTimeout(() => {
          setIsLoading(false);
        }, 5000); // 5 seconds timeout
      } catch (e) {
        console.error('Error creating TradingView widget:', e);
        setError('Error loading chart data');
        setIsLoading(false);
      }
    };

    // First load the TradingView widget script if needed
    try {
      if (!document.getElementById('tradingview-widget-script')) {
        console.log('Loading TradingView script...');
        const tvScript = document.createElement('script');
        tvScript.id = 'tradingview-widget-script';
        tvScript.src = 'https://s3.tradingview.com/tv.js';
        tvScript.async = true;
        tvScript.crossOrigin = 'anonymous'; // Add CORS support

        // Create a promise to handle script loading
        const scriptPromise = new Promise<void>((resolve, reject) => {
          tvScript.onload = () => {
            console.log('TradingView script loaded successfully');
            resolve();
          };
          tvScript.onerror = (e) => {
            console.error('Failed to load TradingView script:', e);
            reject(new Error('Failed to load chart library'));
          };
        });

        document.head.appendChild(tvScript);

        // Wait for script to load with a timeout
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(
            () => reject(new Error('Chart library load timeout')),
            10000,
          );
        });

        // Race between successful load and timeout
        Promise.race([scriptPromise, timeoutPromise])
          .then(() => {
            // Script loaded successfully
            setTimeout(createWidget, 500); // Increased delay to ensure DOM is ready
          })
          .catch((error) => {
            console.error('Error loading TradingView script:', error);
            setError(error.message || 'Failed to load chart library');
            setIsLoading(false);
          });
      } else {
        // TradingView script already loaded, create the widget
        console.log('TradingView script already loaded, creating widget...');
        setTimeout(createWidget, 500); // Increased delay to ensure DOM is ready
      }
    } catch (e) {
      console.error('Error setting up TradingView script:', e);
      setError('Error initializing chart');
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [selectedPair, timeframe, selectedAccount]);

  // If there's an error, show an error message with a fallback chart
  if (error) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center"
        style={{ backgroundColor: '#131722' }}
      >
        <div className="text-center p-6 rounded-lg max-w-md">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">
            TradingView Chart Unavailable
          </h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="flex items-center justify-center gap-2 text-xs text-yellow-500 mb-4">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1" />
            Using fallback chart
          </div>

          {/* Fallback chart - simple static image */}
          <div className="w-full h-48 bg-gray-900 rounded-md mb-4 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full flex items-end justify-center px-4 pb-4">
              {/* Simple price chart visualization */}
              <div className="h-1/3 w-1/6 bg-crypto-green rounded-sm mx-0.5"></div>
              <div className="h-2/5 w-1/6 bg-crypto-red rounded-sm mx-0.5"></div>
              <div className="h-1/2 w-1/6 bg-crypto-green rounded-sm mx-0.5"></div>
              <div className="h-3/5 w-1/6 bg-crypto-green rounded-sm mx-0.5"></div>
              <div className="h-1/4 w-1/6 bg-crypto-red rounded-sm mx-0.5"></div>
              <div className="h-3/4 w-1/6 bg-crypto-green rounded-sm mx-0.5"></div>
            </div>
          </div>

          <button
            onClick={() => {
              setIsLoading(true);
              setError(null);
              // Force reload the TradingView script
              const oldScript = document.getElementById(
                'tradingview-widget-script',
              );
              if (oldScript) {
                oldScript.remove();
              }
              // Reload the component
              setTimeout(() => window.location.reload(), 500);
            }}
            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center justify-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  // If it's loading, show a loading message
  if (isLoading) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: '#131722' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading chart...</p>
        </div>
      </div>
    );
  }

  // Show the chart container
  return (
    <div
      className="w-full h-full relative"
      style={{ backgroundColor: '#131722' }}
    >
      <div ref={containerRef} className="w-full h-full" />
      {useMockData && (
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-black bg-opacity-50 px-2 py-1 rounded text-xs z-10">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-yellow-500">Using mock data</span>
        </div>
      )}

      {/* Add a retry button that's always visible */}
      <div className="absolute bottom-2 right-2 z-10">
        <button
          onClick={() => {
            setIsLoading(true);
            setError(null);
            // Force reload the component
            if (containerRef.current) {
              containerRef.current.innerHTML = '';
            }
            // Trigger a re-render
            setTimeout(() => {
              if (containerRef.current) {
                const symbol = getSymbol();
                const containerId = `tradingview_chart_${Date.now()}`;
                containerRef.current.id = containerId;
                if (window.TradingView) {
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
                      onChartReady: () => {
                        setIsLoading(false);
                      },
                    });
                  } catch (e) {
                    console.error('Error recreating widget:', e);
                    setError('Failed to reload chart');
                  }
                }
              }
            }, 500);
          }}
          className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
          title="Refresh chart"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
}
