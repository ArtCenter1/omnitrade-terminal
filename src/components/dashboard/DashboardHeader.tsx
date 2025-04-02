import { ExchangeAccountSelector } from "@/components/dashboard/ExchangeAccountSelector";
import { PortfolioIndicators } from "@/components/dashboard/PortfolioIndicators";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function DashboardHeader() {
  return (
    // Using flex layout for responsiveness, items centered vertically
    // Added gap for spacing between elements
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
      {/* Left: Account Selector - Allow shrinking but not growing beyond content size */}
      <div className="flex-shrink-0 w-full md:w-auto">
        <ExchangeAccountSelector />
      </div>

      {/* Middle: Indicators - Allow growing to take available space */}
      <div className="flex-grow w-full md:w-auto">
        <PortfolioIndicators />
      </div>

      {/* Right: Deposit/Earn Button - Allow shrinking but not growing */}
      {/* Styling based on the image: Purple background, white text, bullet points, arrow icon */}
      <div className="flex-shrink-0 w-full md:w-auto">
         <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto px-4 py-3 rounded-lg flex items-center justify-between text-left h-auto">
           <div className="flex flex-col items-start mr-4">
             {/* Using spans for the two lines of text */}
             <span className="text-xs font-medium leading-tight">Deposit OMNI &</span>
             <span className="text-xs font-medium leading-tight">Earn 20% APY</span>
           </div>
           <ArrowRight size={18} className="flex-shrink-0" />
         </Button>
      </div>
    </div>
  );
}
