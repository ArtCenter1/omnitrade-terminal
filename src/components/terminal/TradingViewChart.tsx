import { useEffect, useRef, useState } from 'react';
import { TradingPair } from '@/types/trading';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { useFeatureFlags } from '@/config/featureFlags';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { FallbackChart } from './FallbackChart';

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
    if (!selectedPair) return 'CRYPTOCAP:TOTAL';

    let baseAsset = selectedPair.baseAsset.toUpperCase();
    const quoteAsset = selectedPair.quoteAsset.toUpperCase();

    // Get exchange ID from pair or account
    const exchangeId = (
      selectedPair.exchangeId ||
      (selectedAccount ? selectedAccount.exchangeId : 'binance')
    ).toLowerCase();

    console.log(
      `Creating TradingView symbol for ${baseAsset}/${quoteAsset} on ${exchangeId}`,
    );

    // IMPORTANT: Always default to CRYPTOCAP for guaranteed compatibility
    // This ensures the chart always loads even if the specific pair isn't available
    const fallbackSymbol = 'CRYPTOCAP:TOTAL';

    try {
      // If we're using mock data, always use BINANCE for better compatibility
      const exchange = useMockData
        ? 'BINANCE'
        : EXCHANGE_TO_TRADINGVIEW_MAP[exchangeId] || 'BINANCE';

      // Special case for Kraken BTC pairs (Kraken uses XBT instead of BTC)
      if (!useMockData && exchangeId === 'kraken' && baseAsset === 'BTC') {
        console.log('Using XBT instead of BTC for Kraken');
        baseAsset = 'XBT';
      }

      // Special case for CRYPTOCAP (Total Market Cap)
      if (baseAsset === 'CRYPTOCAP') {
        return 'CRYPTOCAP:TOTAL';
      }

      // Exchange-specific mappings for common pairs
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

      // Create the explicit symbol format
      const symbol = `${exchange}:${baseAsset}${quoteAsset}`;
      console.log(`Generated TradingView symbol: ${symbol}`);
      return symbol;
    } catch (error) {
      console.error('Error generating TradingView symbol:', error);
      return fallbackSymbol;
    }
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
        console.log(
          `Creating TradingView widget with symbol: ${symbol}, container: ${containerId}`,
        );

        // Create widget with error handling
        const widgetOptions = {
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
          // Add error handling
          autosize: true,
          debug: true,
          allow_script_access: true,
          // Handle symbol resolution errors
          datafeed: {
            onReady: (callback: any) => {
              setTimeout(() => callback({}), 0);
            },
            resolveSymbol: (
              symbolName: string,
              onSymbolResolvedCallback: any,
              onResolveErrorCallback: any,
            ) => {
              console.log(`Resolving symbol: ${symbolName}`);
              // If symbol resolution fails, try a fallback
              if (symbolName !== 'CRYPTOCAP:TOTAL') {
                onResolveErrorCallback('Symbol not found');
                // Try to recreate with fallback symbol
                console.log('Symbol resolution failed, trying fallback...');
                setTimeout(() => {
                  try {
                    if (container) {
                      container.innerHTML = '';
                      new window.TradingView.widget({
                        ...widgetOptions,
                        symbol: 'CRYPTOCAP:TOTAL',
                      });
                    }
                  } catch (e) {
                    console.error('Error creating fallback widget:', e);
                  }
                }, 500);
              }
            },
          },
        };

        // Create the widget
        new window.TradingView.widget(widgetOptions);
        console.log(`TradingView widget created with symbol: ${symbol}`);

        // Set a timeout to detect if the chart fails to load
        const loadTimeout = setTimeout(() => {
          console.log(
            'Chart load timeout reached, checking if chart is visible...',
          );

          // Check if the chart is actually visible
          const chartElement = container.querySelector('iframe, canvas');
          if (!chartElement || chartElement.clientWidth === 0) {
            console.warn('Chart not visible after timeout, trying fallback...');

            // Try recreating with a guaranteed symbol
            try {
              container.innerHTML = '';
              new window.TradingView.widget({
                ...widgetOptions,
                symbol: 'CRYPTOCAP:TOTAL',
              });
              console.log('Created fallback chart with CRYPTOCAP:TOTAL');
            } catch (fallbackError) {
              console.error('Error creating fallback chart:', fallbackError);
              setError('Could not load chart data');
            }
          }

          setIsLoading(false);
        }, 8000); // 8 seconds timeout

        // Clear timeout if component unmounts
        return () => clearTimeout(loadTimeout);
      } catch (e) {
        console.error('Error creating TradingView widget:', e);
        setError('Error loading chart data');
        setIsLoading(false);

        // Try one more time with a guaranteed symbol
        try {
          if (container) {
            container.innerHTML = '';
            new window.TradingView.widget({
              width: '100%',
              height: '100%',
              symbol: 'CRYPTOCAP:TOTAL',
              interval: timeframe,
              timezone: 'Etc/UTC',
              theme: 'dark',
              style: '1',
              locale: 'en',
              toolbar_bg: '#131722',
              enable_publishing: false,
              container_id: containerId,
            });
            console.log('Created emergency fallback chart');
          }
        } catch (fallbackError) {
          console.error(
            'Error creating emergency fallback chart:',
            fallbackError,
          );
        }
      }
    };

    // First load the TradingView widget script if needed
    try {
      // Check if TradingView is already available in the window object
      if (typeof window.TradingView !== 'undefined') {
        console.log(
          'TradingView already available in window, creating widget...',
        );
        setTimeout(createWidget, 100);
        return;
      }

      // Check if script is already in the DOM but not loaded yet
      const existingScript = document.getElementById(
        'tradingview-widget-script',
      );
      if (existingScript) {
        console.log(
          'TradingView script already in DOM, waiting for it to load...',
        );

        // If the script is already in the DOM but TradingView is not defined,
        // it might still be loading, so we'll wait and try again
        const checkInterval = setInterval(() => {
          if (typeof window.TradingView !== 'undefined') {
            console.log('TradingView became available, creating widget...');
            clearInterval(checkInterval);
            setTimeout(createWidget, 100);
          }
        }, 200);

        // Set a timeout to stop checking after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (typeof window.TradingView === 'undefined') {
            console.error('TradingView failed to load after waiting');
            setError('Chart library failed to initialize');
            setIsLoading(false);

            // Try to reload the script as a last resort
            existingScript.remove();
            loadTradingViewScript();
          }
        }, 10000);

        return;
      }

      // If we get here, we need to load the script
      loadTradingViewScript();
    } catch (e) {
      console.error('Error setting up TradingView script:', e);
      setError('Error initializing chart');
      setIsLoading(false);
    }

    // Function to load the TradingView script
    function loadTradingViewScript() {
      console.log('Loading TradingView script...');

      // Try multiple CDN sources in case one fails
      const scriptSources = [
        'https://s3.tradingview.com/tv.js',
        'https://d33t3vvu2t2yu5.cloudfront.net/tv.js',
        'https://unpkg.com/trading-view/dist/main.js',
      ];

      let currentSourceIndex = 0;

      function tryLoadScript() {
        if (currentSourceIndex >= scriptSources.length) {
          console.error('All TradingView script sources failed');
          setError('Failed to load chart library from all sources');
          setIsLoading(false);
          return;
        }

        const source = scriptSources[currentSourceIndex];
        console.log(`Trying to load TradingView from source: ${source}`);

        const tvScript = document.createElement('script');
        tvScript.id = 'tradingview-widget-script';
        tvScript.src = source;
        tvScript.async = true;
        tvScript.crossOrigin = 'anonymous';

        tvScript.onload = () => {
          console.log(`TradingView script loaded successfully from ${source}`);
          setTimeout(createWidget, 500);
        };

        tvScript.onerror = () => {
          console.error(`Failed to load TradingView script from ${source}`);
          currentSourceIndex++;
          tvScript.remove();
          tryLoadScript();
        };

        document.head.appendChild(tvScript);
      }

      tryLoadScript();
    }

    // Cleanup function
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [selectedPair, timeframe, selectedAccount]);

  // Use a state to track if we should show the fallback chart
  const [showFallback, setShowFallback] = useState(false);

  // If loading takes more than 5 seconds, show the fallback chart
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      timer = setTimeout(() => {
        console.log('Loading timeout reached, showing fallback chart');
        setShowFallback(true);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isLoading]);

  // If there's an error or we've decided to show the fallback, use our custom chart
  if (error || showFallback) {
    return (
      <div className="w-full h-full relative">
        {/* Render our custom fallback chart */}
        <FallbackChart selectedPair={selectedPair} timeframe={timeframe} />

        {/* Show error message as an overlay if there was an actual error */}
        {error && (
          <div className="absolute top-2 left-2 right-2 bg-red-900 bg-opacity-90 text-white p-2 rounded text-sm z-20">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>TradingView chart unavailable: {error}</span>
            </div>
          </div>
        )}

        {/* Add a retry button */}
        <div className="absolute bottom-2 right-2 z-10">
          <button
            onClick={() => {
              console.log('Attempting to reload TradingView chart');
              setError(null);
              setIsLoading(true);
              setShowFallback(false);

              // Force reload the TradingView script
              const oldScript = document.getElementById(
                'tradingview-widget-script',
              );
              if (oldScript) {
                oldScript.remove();
              }

              // Reload the page to get a fresh start
              window.location.reload();
            }}
            className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
            title="Try TradingView chart"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>
    );
  }

  // If it's still loading and we haven't timed out yet, show a loading message
  if (isLoading && !showFallback) {
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

      {/* Add buttons for chart options */}
      <div className="absolute bottom-2 right-2 z-10 flex gap-1">
        {/* Button to switch to fallback chart */}
        <button
          onClick={() => {
            console.log('Switching to fallback chart');
            setShowFallback(true);
          }}
          className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white"
          title="Use fallback chart"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
        </button>

        {/* Button to refresh TradingView chart */}
        <button
          onClick={() => {
            console.log('Manual chart refresh requested');
            setIsLoading(true);
            setError(null);

            // Force reload the component
            if (containerRef.current) {
              containerRef.current.innerHTML = '';

              // Create a new container ID
              const containerId = `tradingview_chart_${Date.now()}`;
              containerRef.current.id = containerId;

              try {
                if (window.TradingView) {
                  // Try with CRYPTOCAP:TOTAL first as it's guaranteed to work
                  const fallbackSymbol = 'CRYPTOCAP:TOTAL';
                  console.log('Creating fallback chart on manual refresh');

                  // First create a chart with a guaranteed symbol
                  new window.TradingView.widget({
                    width: '100%',
                    height: '100%',
                    symbol: fallbackSymbol,
                    interval: timeframe,
                    timezone: 'Etc/UTC',
                    theme: 'dark',
                    style: '1',
                    locale: 'en',
                    toolbar_bg: '#131722',
                    enable_publishing: false,
                    container_id: containerId,
                    onChartReady: () => {
                      console.log('Fallback chart loaded successfully');
                      setIsLoading(false);
                    },
                  });
                } else {
                  console.error('TradingView not available for manual refresh');
                  setError('Chart library not available');
                  setIsLoading(false);
                  setShowFallback(true);
                }
              } catch (e) {
                console.error('Error during manual chart refresh:', e);
                setError('Failed to reload chart');
                setIsLoading(false);
                setShowFallback(true);
              }
            }
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
