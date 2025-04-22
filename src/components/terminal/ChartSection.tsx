import { useEffect, useRef, useState } from 'react'; // Removed React import
import { PriceOverview } from './PriceOverview';
import { TimeframeSelector } from './TimeframeSelector';
import { TradingPairSelector } from './TradingPairSelector';
import { TradingPair } from '@/types/trading'; // Correct import path for the type
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
}: ChartSectionProps) {
  // Removed default value {} as props are expected
  const container = useRef<HTMLDivElement>(null);
  const [currentTimeframe, setCurrentTimeframe] = useState<string>('D'); // Default to Daily
  const { selectedAccount } = useSelectedAccount();

  // No local currentPair state needed, use selectedPair prop directly
  const widgetInstanceRef = useRef<any | null>(null); // Use 'any' for simplicity

  // Helper function to get the correct TradingView symbol format
  // Takes selectedPair prop which might be undefined initially
  const getTradingViewSymbol = (
    account: any,
    pair: TradingPair | undefined,
  ): string => {
    // Default if no pair is selected yet
    if (!pair) {
      console.warn(
        'ChartSection: No selected pair provided, defaulting to BINANCE:BTCUSDT',
      );
      return 'BINANCE:BTCUSDT';
    }
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

  // Main effect for creating/updating the TradingView widget
  useEffect(() => {
    const currentContainer = container.current;
    // Ensure container exists and a pair is selected
    if (!currentContainer || !selectedPair) {
      if (currentContainer) currentContainer.innerHTML = ''; // Clear if pair becomes null/undefined
      widgetInstanceRef.current = null;
      return;
    }

    // Function to create or update the widget
    const createOrUpdateWidget = () => {
      // Double check TradingView is loaded and selectedPair exists
      if (
        typeof window.TradingView !== 'undefined' &&
        window.TradingView.widget &&
        selectedPair
      ) {
        // Clear previous widget before creating a new one for reliability
        currentContainer.innerHTML = '';

        // Get the properly formatted symbol using the selectedPair prop
        const symbolFormat = getTradingViewSymbol(
          selectedAccount,
          selectedPair,
        );
        console.log(
          `ChartSection: Creating/Updating TradingView widget with symbol: ${symbolFormat}, interval: ${currentTimeframe}`,
        );

        // Create the new widget instance
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
      } else {
        console.log(
          'ChartSection: TradingView not ready or no selected pair, clearing widget container.',
        );
        if (currentContainer) currentContainer.innerHTML = ''; // Clear if condition not met
        widgetInstanceRef.current = null;
      }
    };

    // Script loading logic
    const scriptId = 'tradingview-widget-script';
    const existingScript = document.getElementById(
      scriptId,
    ) as HTMLScriptElement | null;

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://s3.tradingview.com/tv.js';
      script.type = 'text/javascript';
      script.async = true;
      script.onload = createOrUpdateWidget; // Use the combined function
      document.body.appendChild(script);
    } else if (
      (existingScript as any).readyState === 'complete' || // Use 'any' to bypass TS check if needed, or check specific browser compatibility
      (existingScript as any).readyState === 'loaded' ||
      typeof window.TradingView !== 'undefined'
    ) {
      // If script exists and TradingView is loaded (or script finished loading), create/update widget
      createOrUpdateWidget();
    } else {
      // If script exists but TradingView is not loaded yet, wait for onload
      existingScript.addEventListener('load', createOrUpdateWidget);
    }

    // Cleanup function
    return () => {
      if (existingScript) {
        existingScript.removeEventListener('load', createOrUpdateWidget);
      }
      // No need to clear innerHTML here as the effect will handle it on next run
      // Resetting ref is also handled implicitly by the effect re-running
    };
    // Depend on the selectedPair prop, timeframe, and account
  }, [selectedPair, currentTimeframe, selectedAccount]);

  // Removed the redundant useEffect hook that synced selectedPair prop to local state

  const handleTimeframeSelect = (timeframe: string) => {
    setCurrentTimeframe(timeframe);
  };

  // Removed local handlePairSelect function

  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-gray-800">
        {/* Left Side: Pair Selector and Minimal Price */}
        <div className="flex items-center">
          {/* Pass props directly to TradingPairSelector */}
          <TradingPairSelector
            onPairSelect={onPairSelect} // Pass down the handler from Terminal.tsx
            currentPair={selectedPair} // Pass down the selected pair from Terminal.tsx
          />
          {/* PriceOverview uses the selectedPair prop */}
          {selectedPair && (
            <PriceOverview selectedPair={selectedPair} showPriceOnly={true} />
          )}
        </div>
        {/* Right Side: Full Price Overview and Sandbox Selector */}
        <div className="flex items-center gap-2">
          <SandboxNetworkSelector />
          {/* PriceOverview uses the selectedPair prop */}
          {selectedPair && <PriceOverview selectedPair={selectedPair} />}
        </div>
      </div>

      {/* TradingView Widget Container */}
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
