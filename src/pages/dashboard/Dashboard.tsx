import React, { useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PerformanceChart } from '@/components/PerformanceChart';
import { AllocationChart } from '@/components/AllocationChart';
import { AssetRow } from '@/components/AssetRow';
import { Button } from '@/components/ui/button';

const mockPerformanceData = [
  { date: 'Mon', value: 40000 },
  { date: 'Tue', value: 41000 },
  { date: 'Wed', value: 42000 },
  { date: 'Thu', value: 41500 },
  { date: 'Fri', value: 43000 },
  { date: 'Sat', value: 42500 },
  { date: 'Sun', value: 44000 },
];

const mockAllocationData = [
  { name: 'Bitcoin', value: 60, color: '#f7931a' },
  { name: 'Ethereum', value: 25, color: '#627eea' },
  { name: 'Solana', value: 15, color: '#00ffb9' },
];

const mockAssets = [
  {
    icon: '/placeholder.svg',
    name: 'Bitcoin',
    symbol: 'BTC',
    amount: '0.8945 BTC',
    value: '$24,897.70',
    price: '$27,834.21',
    change: '-2.34%',
  },
  {
    icon: '/placeholder.svg',
    name: 'Ethereum',
    symbol: 'ETH',
    amount: '5.2341 ETH',
    value: '$9,644.32',
    price: '$1,842.56',
    change: '-3.12%',
  },
  {
    icon: '/placeholder.svg',
    name: 'Solana',
    symbol: 'SOL',
    amount: '58.4321 SOL',
    value: '$5,770.53',
    price: '$98.76',
    change: '+1.24%',
  },
];

const TABS = [
  { label: 'Balances', color: 'border-purple-500', icon: null },
  { label: 'Open Orders', color: '', icon: null },
  { label: 'Order History', color: '', icon: <span className="ml-1 w-2 h-2 bg-purple-500 rounded-full inline-block" /> },
  { label: 'Transfers', color: '', icon: null },
];

const TIME_RANGES = ['Day', 'Week', 'Month', 'Year', '5 Years'];

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Balances');
  const [activeRange, setActiveRange] = useState('Week');

  return (
    <div className="container mx-auto p-4 theme-transition">
      <div className="grid grid-cols-1 gap-6">
        {/* Portfolio Overview - DashboardHeader */}
        <DashboardHeader />

        {/* Performance Chart and Allocation Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 dashboard-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-theme-primary">Performance</h2>
              <div className="flex gap-2">
                {TIME_RANGES.map((range) => (
                  <Button
                    key={range}
                    variant={activeRange === range ? "default" : "outline"}
                    className={`text-xs px-3 py-1 rounded-full ${activeRange === range ? "bg-purple-600 text-white" : "bg-transparent text-gray-400 border-gray-700"}`}
                    onClick={() => setActiveRange(range)}
                  >
                    {range}
                  </Button>
                ))}
              </div>
            </div>
            <PerformanceChart data={mockPerformanceData} isPositive={true} />
          </div>
          <div className="dashboard-card p-5">
            <h2 className="text-lg font-semibold text-theme-primary mb-4">Current Allocations</h2>
            <AllocationChart data={mockAllocationData} />
          </div>
        </div>

        {/* Assets Table with Tabs */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme-primary">Portfolio Overview</h2>
            <div className="flex gap-2 items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Assets"
                  className="search-input"
                />
              </div>
              <Button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs">DEPOSIT</Button>
              <Button className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-xs">WITHDRAW</Button>
            </div>
          </div>
          {/* Tab Bar */}
          <div className="flex gap-4 mb-4 border-b border-gray-800">
            {TABS.map((tab) => (
              <button
                key={tab.label}
                className={`pb-2 px-2 text-sm font-medium focus:outline-none border-b-2 transition-colors ${
                  activeTab === tab.label
                    ? `border-purple-500 text-white`
                    : `border-transparent text-gray-400 hover:text-white`
                }`}
                onClick={() => setActiveTab(tab.label)}
              >
                {tab.label}
                {tab.icon}
              </button>
            ))}
          </div>
          {/* Tab Content */}
          {activeTab === 'Balances' && (
            <div className="overflow-x-auto">
              <table className="portfolio-table w-full">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Amount</th>
                    <th>Value (USD)</th>
                    <th>Last Price</th>
                    <th>24h Change</th>
                    <th>7d Chart</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAssets.map((asset, idx) => (
                    <AssetRow key={asset.symbol + idx} asset={asset} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {activeTab !== 'Balances' && (
            <div className="text-gray-400 text-center py-8">No data for this tab yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
