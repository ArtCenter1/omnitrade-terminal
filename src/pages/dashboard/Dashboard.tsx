import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PerformanceChart } from '@/components/PerformanceChart';
import { AllocationChart } from '@/components/AllocationChart';
import { AssetRow } from '@/components/AssetRow';

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

const Dashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4 theme-transition">
      <div className="grid grid-cols-1 gap-6">
        {/* Portfolio Overview - DashboardHeader */}
        <DashboardHeader />

        {/* Performance Chart and Allocation Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 dashboard-card p-5">
            <h2 className="text-lg font-semibold text-theme-primary mb-4">Performance</h2>
            <PerformanceChart data={mockPerformanceData} isPositive={true} />
          </div>
          <div className="dashboard-card p-5">
            <h2 className="text-lg font-semibold text-theme-primary mb-4">Currency Breakdown</h2>
            <AllocationChart data={mockAllocationData} />
          </div>
        </div>

        {/* Assets Table */}
        <div className="dashboard-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-theme-primary">Portfolio Overview</h2>
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search assets..."
                className="search-input"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="portfolio-table w-full">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Holdings</th>
                  <th>Value</th>
                  <th>Price</th>
                  <th>24h Change</th>
                  <th>Chart</th>
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
