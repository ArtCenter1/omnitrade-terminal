import { PriceOverview } from './PriceOverview';
import { TradingPairSelector } from './TradingPairSelector';
import { TradingPair } from '@/types/trading';
import { TradingViewContainer } from '@/components/shared/TradingViewContainer';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChartSectionProps {
  selectedPair?: TradingPair;
  onPairSelect?: (pair: TradingPair) => void;
}

export function ChartSection({
  selectedPair,
  onPairSelect,
}: ChartSectionProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between px-4 py-1 border-b border-theme-border bg-[var(--bg-navbar)] theme-transition">
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
        {/* Right Side: Full Price Overview and Controls */}
        <div className="flex items-center gap-4">
          {/* PriceOverview uses the selectedPair prop */}
          {selectedPair && <PriceOverview selectedPair={selectedPair} />}

          {/* Notification Bell */}
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <Bell size={16} />
          </Button>
        </div>
      </div>

      {/* TradingView Chart Container */}
      <div className="flex-grow p-0">
        <TradingViewContainer selectedPair={selectedPair} />
      </div>
    </div>
  );
}
