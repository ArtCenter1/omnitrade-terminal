
import { ArrowDown, BarChart3, ChevronDown, Clock, History, LayoutGrid, Menu, Search, Settings, Maximize, Save, BarChart, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockAssets, generatePriceChartData } from "@/lib/utils";
import { TradingSidebar } from "@/components/terminal/TradingSidebar";
import { ChartHeader } from "@/components/terminal/ChartHeader";
import { ChartSection } from "@/components/terminal/ChartSection";
import { OrderBook } from "@/components/terminal/OrderBook";
import { AssetsTable } from "@/components/terminal/AssetsTable";

export default function Terminal() {

  return (
    <div className="bg-black min-h-screen">
      <div className="grid grid-cols-12 gap-0">
        <TradingSidebar />
        
        <div className="col-span-9">
          
          <div className="grid grid-cols-12 gap-0">
            <ChartSection />
            <OrderBook />
          </div>
          
          <AssetsTable />
        </div>
      </div>
    </div>
  );
}
