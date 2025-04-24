import { useState } from 'react';
import { PriceOverview } from './PriceOverview';
import { TimeframeSelector } from './TimeframeSelector';
import { TradingPairSelector } from './TradingPairSelector';
import { TradingPair } from '@/types/trading';
import { SandboxNetworkSelector } from '@/components/SandboxNetworkSelector';
import { TradingViewContainer } from './TradingViewContainer';

interface ChartSectionProps {
  selectedPair?: TradingPair;
  onPairSelect?: (pair: TradingPair) => void;
}

export function ChartSection({
  selectedPair,
  onPairSelect,
}: ChartSectionProps) {
  const [currentTimeframe, setCurrentTimeframe] = useState<string>('D'); // Default to Daily

  const handleTimeframeSelect = (timeframe: string) => {
    setCurrentTimeframe(timeframe);
  };

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

      {/* TradingView Chart Container */}
      <div className="flex-grow p-0">
        <TradingViewContainer
          selectedPair={selectedPair}
          timeframe={currentTimeframe}
        />
      </div>

      {/* Pass state and handler to TimeframeSelector */}
      <TimeframeSelector
        currentTimeframe={currentTimeframe}
        onTimeframeSelect={handleTimeframeSelect}
      />
    </div>
  );
}
