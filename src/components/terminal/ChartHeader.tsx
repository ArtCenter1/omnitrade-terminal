import React from "react";
import {
  BarChart3,
  BarChart,
  Save,
  Settings,
  Maximize,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketSelector } from "./MarketSelector";

export function ChartHeader() {
  return (
    <div className="flex justify-between items-center border-b border-[var(--border-primary)] p-3 bg-[var(--bg-secondary)] theme-transition">
      <div className="flex items-center space-x-2">
        <MarketSelector image="/placeholder.svg" name="BTC/USDT" />

        <div className="text-xs text-[var(--text-secondary)]">1h</div>

        <Button variant="ghost" size="sm" className="p-1 h-7 text-[var(--text-secondary)]">
          <BarChart3 size={16} />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 h-7 text-[var(--text-secondary)]">
          <BarChart size={16} />
        </Button>

        <Button variant="ghost" size="sm" className="h-7 text-[var(--text-secondary)] text-xs">
          Indicators
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" className="p-1 h-7 text-[var(--text-secondary)]">
          <Save size={16} />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 h-7 text-[var(--text-secondary)]">
          <Settings size={16} />
        </Button>
        <Button variant="ghost" size="sm" className="p-1 h-7 text-[var(--text-secondary)]">
          <Maximize size={16} />
        </Button>
      </div>
    </div>
  );
}
