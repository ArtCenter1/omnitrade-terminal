import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioIndicatorProps {
  title: string;
  value: string;
  change: string;
  isPercentage?: boolean;
  isPositive?: boolean;
}

const PortfolioIndicator = ({
  title,
  value,
  change,
  isPercentage = false,
  isPositive = false,
}: PortfolioIndicatorProps) => {
  return (
    <div className="flex flex-col">
      <div className="text-xs text-gray-400 uppercase mb-1">{title}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div
        className={cn(
          "flex items-center text-sm mt-1",
          isPositive ? "text-crypto-green" : "text-crypto-red"
        )}
      >
        {isPositive ? (
          <ArrowUpRight size={14} className="mr-1" />
        ) : (
          <ArrowDownRight size={14} className="mr-1" />
        )}
        <span>
          {change}
          {isPercentage && "%"}
        </span>
      </div>
    </div>
  );
};

export function PortfolioIndicators() {
  return (
    <div className="flex justify-between items-center mb-6 px-1">
      <PortfolioIndicator
        title="Portfolio Value (USD)"
        value="$47,854.48"
        change="-$2,139.11"
        isPositive={false}
      />

      <PortfolioIndicator
        title="24h Change (USD)"
        value="-$2,139.11"
        change="-$2,139.11"
        isPositive={false}
      />

      <PortfolioIndicator
        title="24h Change (%)"
        value="-4.28%"
        change="4.28"
        isPercentage={true}
        isPositive={false}
      />
    </div>
  );
}
