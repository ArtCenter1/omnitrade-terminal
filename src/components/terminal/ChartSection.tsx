import { useEffect, useRef, useState } from 'react'; // Removed React import
import { PriceOverview } from './PriceOverview';
import { TimeframeSelector } from './TimeframeSelector';
import { TradingPairSelector, TradingPair } from './TradingPairSelector';
import { useSelectedAccount } from '@/hooks/useSelectedAccount';
import { SandboxNetworkSelector } from '@/components/SandboxNetworkSelector';

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

// Define an interface for the TradingView widget options
interface TradingViewWidgetOptions {
  autosize?: boolean;
  symbol: string;
  interval: string; // This will be dynamic now
  timezone?: string;
  theme?: string;
  style?: string;
  locale?: string;
  enable_publishing?: boolean;
  allow_symbol_change?: boolean;
  container_id: string;
  hide_side_toolbar?: boolean; // Added for drawing tools
  // Add other potential options here if needed
}

// Extend the Window interface to include TradingView with more specific types
declare global {
  interface Window {
    TradingView?: {
      widget: new (options: TradingViewWidgetOptions) => unknown;
    };
  }
}

interface ChartSectionProps {
  selectedPair?: TradingPair;
  onPairSelect?: (pair: TradingPair) => void;
}

export function ChartSection({
  selectedPair,
  onPairSelect,
}: ChartSectionProps = {}) {
  const container = useRef<HTMLDivElement>(null);
  const [currentTimeframe, setCurrentTimeframe] = useState<string>('D'); // Default to Daily
  const { selectedAccount } = useSelectedAccount();

  // Use the provided selectedPair or a default
  const [currentPair, setCurrentPair] = useState<TradingPair>(
    selectedPair || {
      symbol: 'BTC/USDT',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      price: '84,316.58',
      change24h: '+0.92%',
      volume24h: '1.62b',
      isFavorite: true,
    },
  );
  const widgetInstanceRef = useRef<unknown | null>(null); // To potentially hold widget instance if needed, though direct update is tricky here

  // Helper function to get the correct TradingView symbol format
  const getTradingViewSymbol = (account: any, pair: TradingPair): string => {
    // Handle sandbox mode
    if (account?.exchangeId === 'sandbox') {
      const preferredTestNetwork =
        localStorage.getItem('sandbox_test_network') || 'binance';
      const testExchange = preferredTestNetwork.toUpperCase();
      return `${testExchange}:${pair.baseAsset}${pair.quoteAsset}`;
    }

    // First try to use the exchange from the pair itself
    if (pair.exchangeId) {
      const pairExchangeId = pair.exchangeId.toLowerCase();
      const tvExchange =
        EXCHANGE_TO_TRADINGVIEW_MAP[pairExchangeId] ||
        EXCHANGE_TO_TRADINGVIEW_MAP['binance'];

      console.log(
        `Using pair's exchange ID ${pairExchangeId} for TradingView symbol: ${tvExchange}:${pair.baseAsset}${pair.quoteAsset}`,
      );

      return `${tvExchange}:${pair.baseAsset}${pair.quoteAsset}`;
    }

    // Fallback to account's exchange ID
    const exchangeId = account?.exchangeId?.toLowerCase() || 'binance';
    const tvExchange = EXCHANGE_TO_TRADINGVIEW_MAP[exchangeId] || 'BINANCE';

    // Log for debugging
    console.log(
      `Falling back to account's exchange ID ${exchangeId} for TradingView symbol: ${tvExchange}:${pair.baseAsset}${pair.quoteAsset}`,
    );

    // Return the formatted symbol
    return `${tvExchange}:${pair.baseAsset}${pair.quoteAsset}`;
  };

  useEffect(() => {
    const currentContainer = container.current;
    if (!currentContainer) {
      return;
    }

    // Function to create the widget
    const createWidget = () => {
      if (
        typeof window.TradingView !== 'undefined' &&
        window.TradingView.widget
      ) {
        // Clear previous widget before creating a new one
        currentContainer.innerHTML = '';

        // Get the properly formatted symbol for TradingView
        const symbolFormat = getTradingViewSymbol(selectedAccount, currentPair);
        console.log(`Creating TradingView widget with symbol: ${symbolFormat}`);

        // Create the widget with the correct symbol format
        widgetInstanceRef.current = new window.TradingView.widget({
          autosize: true,
          symbol: symbolFormat,
          interval: currentTimeframe, // Use state variable
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          enable_publishing: false,
          allow_symbol_change: true, // Keep symbol change enabled
          container_id: currentContainer.id, // Use the container's actual ID
          hide_side_toolbar: false, // Ensure drawing toolbar is visible
        });
      }
    };

    // Check if the TradingView script is loaded
    const scriptId = 'tradingview-widget-script';
    const existingScript = document.getElementById(
      scriptId,
    ) as HTMLScriptElement | null;

    if (!existingScript) {
      // Create and append the TradingView script if it doesn't exist
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = createWidget; // Create widget once script is loaded
      document.body.appendChild(script);
    } else if (existingScript && typeof window.TradingView !== 'undefined') {
      // If script exists and TradingView is loaded, create the widget immediately
      createWidget();
    } else {
      // If script exists but TradingView is not loaded yet, wait for onload
      existingScript.addEventListener('load', createWidget);
    }

    // Cleanup function
    return () => {
      // Remove the event listener if added
      if (existingScript) {
        existingScript.removeEventListener('load', createWidget);
      }

      // Just clear the container instead of trying to remove the widget
      // This avoids the "Cannot read properties of null" error
      if (currentContainer) {
        currentContainer.innerHTML = ''; // Clear container on unmount/re-render
      }

      // Reset the widget instance reference
      widgetInstanceRef.current = null;
    };
    // Re-run effect when currentTimeframe, currentPair, or selectedAccount changes
  }, [currentTimeframe, currentPair, selectedAccount]);

  // Update currentPair when selectedPair changes
  useEffect(() => {
    if (selectedPair) {
      console.log(
        `ChartSection: Updating to selected pair ${selectedPair.symbol}`,
      );
      setCurrentPair(selectedPair);

      // Force recreation of the TradingView widget with the new symbol
      const currentContainer = container.current;
      if (currentContainer) {
        currentContainer.innerHTML = '';

        // Small delay to ensure the DOM is updated
        setTimeout(() => {
          if (
            typeof window.TradingView !== 'undefined' &&
            window.TradingView.widget
          ) {
            // Get the properly formatted symbol for TradingView
            const symbolFormat = getTradingViewSymbol(
              selectedAccount,
              selectedPair,
            );
            console.log(
              `Recreating TradingView widget with symbol: ${symbolFormat}`,
            );

            // Create the widget with the correct symbol format
            widgetInstanceRef.current = new window.TradingView.widget({
              autosize: true,
              symbol: symbolFormat,
              interval: currentTimeframe,
              timezone: 'Etc/UTC',
              theme: 'dark',
              style: '1',
              locale: 'en',
              enable_publishing: false,
              allow_symbol_change: true,
              container_id: currentContainer.id,
              hide_side_toolbar: false,
            });
            console.log(
              `TradingView widget recreated with symbol: ${selectedPair.baseAsset}${selectedPair.quoteAsset} on ${symbolFormat}`,
            );
          }
        }, 50);
      }
    }
  }, [selectedPair, selectedAccount, currentTimeframe]);

  const handleTimeframeSelect = (timeframe: string) => {
    setCurrentTimeframe(timeframe);
  };

  const handlePairSelect = (pair: TradingPair) => {
    setCurrentPair(pair);
    // Call the parent's onPairSelect if provided
    if (onPairSelect) {
      onPairSelect(pair);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 border-b border-gray-800">
        <div className="flex items-center">
          <TradingPairSelector
            onPairSelect={handlePairSelect}
            currentPair={currentPair}
          />
          <PriceOverview selectedPair={currentPair} showPriceOnly={true} />
        </div>
        <div className="flex items-center gap-2">
          <SandboxNetworkSelector />
          <PriceOverview selectedPair={currentPair} />
        </div>
      </div>

      {/* TradingView Widget Container - Ensure it has the ID used in options */}
      <div
        id="tradingview-widget-container-div"
        ref={container}
        className="flex-grow p-0"
      >
        {/* The TradingView widget will be rendered here */}
      </div>

      {/* Pass state and handler to TimeframeSelector */}
      <TimeframeSelector
        currentTimeframe={currentTimeframe}
        onTimeframeSelect={handleTimeframeSelect}
      />
    </div>
  );
}
