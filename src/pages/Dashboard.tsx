import { ArrowDownRight, Cog, ExternalLink, Info, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AssetRow } from "@/components/AssetRow";
import { PerformanceChart } from "@/components/PerformanceChart";
import { AllocationChart } from "@/components/AllocationChart";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"; // Import the new header
import {
  mockAssets,
  formatCurrency,
  generatePriceChartData,
  generateAllocationData,
} from "@/lib/utils";

export default function Dashboard() {
  const performanceChartData = generatePriceChartData(false);
  const allocationData = generateAllocationData();

  return (
    <div className="container mx-auto p-6 bg-theme-primary theme-transition">
      {/* Add the new header component here */}
      <DashboardHeader />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <div className="bg-theme-card rounded-lg p-6 shadow-theme-sm theme-transition">
            {/* Remove the old header elements */}
            <div>
              <h4 className="flex items-center text-sm text-theme-secondary mb-2">
                Performance
                <Info size={14} className="ml-1 text-theme-tertiary" />
              </h4>
              <div className="mb-2">
                <Tabs defaultValue="1w">
                  <TabsList className="bg-theme-tertiary">
                    <TabsTrigger value="1d">1d</TabsTrigger>
                    <TabsTrigger value="1w">1w</TabsTrigger>
                    <TabsTrigger value="1m">1m</TabsTrigger>
                    <TabsTrigger value="1y">1y</TabsTrigger>
                    <TabsTrigger value="all">All Time</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="h-60">
                <PerformanceChart
                  data={performanceChartData}
                  isPositive={false}
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-theme-card rounded-lg p-6 h-full shadow-theme-sm theme-transition">
            <div className="flex items-center justify-between mb-4">
              <h4 className="flex items-center text-sm text-theme-secondary">
                Current Allocations
                <Info size={14} className="ml-1 text-theme-tertiary" />
              </h4>
              <Button
                variant="ghost"
                size="sm"
                className="text-theme-secondary h-6 w-6 p-0 hover:text-theme-primary theme-transition"
              >
                <Cog size={16} />
              </Button>
            </div>

            <div className="flex items-center justify-center">
              <AllocationChart data={allocationData} className="h-56 w-full" />
            </div>

            {/* Remove the Earn button and Upgrade promo */}
            <div className="mt-4">{/* Content removed */}</div>
          </div>
        </div>
      </div>

      <div className="bg-theme-card rounded-lg overflow-hidden mb-8 shadow-theme-md theme-transition">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-theme-primary">
              Portfolio Overview
            </h2>
            <div className="flex items-center">
              <div className="relative mr-4">
                <Search
                  className="text-theme-tertiary absolute left-3 top-1/2 transform -translate-y-1/2"
                  size={16}
                />
                <Input
                  placeholder="Search Assets"
                  className="pl-10 bg-theme-tertiary border-theme-primary text-sm h-9 rounded-full w-60 text-theme-secondary"
                />
              </div>
              <Button className="text-xs bg-success-color hover:bg-success-color/90 text-white rounded px-4 theme-transition">
                DEPOSIT
              </Button>
              <Button
                variant="outline"
                className="ml-2 text-xs border-theme-primary text-theme-secondary hover:bg-theme-hover rounded theme-transition"
              >
                WITHDRAW
              </Button>
            </div>
          </div>

          <Tabs defaultValue="balances">
            <TabsList className="bg-transparent border-b border-theme-primary w-full justify-start theme-transition">
              <TabsTrigger
                value="balances"
                className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent text-sm text-theme-secondary theme-transition"
              >
                Balances
              </TabsTrigger>
              <TabsTrigger
                value="openOrders"
                className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent text-sm text-theme-secondary theme-transition"
              >
                Open Orders
              </TabsTrigger>
              <TabsTrigger
                value="orderHistory"
                className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent text-sm text-theme-secondary theme-transition"
              >
                Order History
              </TabsTrigger>
              <TabsTrigger
                value="transfers"
                className="data-[state=active]:border-primary border-b-2 border-transparent rounded-none data-[state=active]:shadow-none data-[state=active]:bg-transparent text-sm text-theme-secondary theme-transition"
              >
                Transfers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="balances" className="mt-0 pt-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-theme-primary">
                      <th className="text-left py-4 px-4 text-sm font-medium text-theme-tertiary">
                        Asset
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-theme-tertiary">
                        Amount
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-theme-tertiary">
                        <div className="flex items-center">
                          Value (USD)
                          <Info
                            size={14}
                            className="ml-1 text-theme-tertiary"
                          />
                        </div>
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-theme-tertiary">
                        <div className="flex items-center">
                          Last Price
                          <Info
                            size={14}
                            className="ml-1 text-theme-tertiary"
                          />
                        </div>
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-theme-tertiary">
                        24h Change
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-theme-tertiary">
                        7d Chart
                      </th>
                      <th className="text-left py-4 px-4 text-sm font-medium text-theme-tertiary">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAssets.map((asset, index) => (
                      <AssetRow key={index} asset={asset} />
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="openOrders">
              <div className="p-8 text-center text-theme-secondary">
                <p>No open orders at the moment</p>
              </div>
            </TabsContent>

            <TabsContent value="orderHistory">
              <div className="p-8 text-center text-theme-secondary">
                <p>No recent order history</p>
              </div>
            </TabsContent>

            <TabsContent value="transfers">
              <div className="p-8 text-center text-theme-secondary">
                <p>No recent transfers</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
