import React from 'react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import { Search } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock data
  const portfolioData = {
    portfolioValue: 40323.05,
    change24h: -1504.64,
    changePercent: -3.60
  };

  return (
    <div className="container mx-auto p-4 theme-transition">
      <div className="grid grid-cols-1 gap-6">
        {/* Portfolio Overview - replaced with DashboardHeader */}
        <DashboardHeader />

        {/* Performance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PerformanceChart />
          </div>
          
          <div className="dashboard-card p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-theme-primary mb-4">Currency Breakdown</h2>
              
              {/* Donut chart placeholder */}
              <div className="w-full h-64 bg-theme-chart rounded-md flex items-center justify-center">
                <div className="text-theme-tertiary">
                  Donut chart would be rendered here
                </div>
              </div>
            </div>
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
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Price</th>
                  <th>Holdings</th>
                  <th>Value</th>
                  <th>24h Change</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">BTC</div>
                      <div>
                        <div className="asset-name">Bitcoin</div>
                        <div className="asset-symbol">BTC</div>
                      </div>
                    </div>
                  </td>
                  <td>$27,834.21</td>
                  <td>0.8945 BTC</td>
                  <td>$24,897.70</td>
                  <td className="negative-value">-2.34%</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="button-success text-xs py-1 px-2">Buy</button>
                      <button className="button-secondary text-xs py-1 px-2">Sell</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-white font-bold text-xs">ETH</div>
                      <div>
                        <div className="asset-name">Ethereum</div>
                        <div className="asset-symbol">ETH</div>
                      </div>
                    </div>
                  </td>
                  <td>$1,842.56</td>
                  <td>5.2341 ETH</td>
                  <td>$9,644.32</td>
                  <td className="negative-value">-3.12%</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="button-success text-xs py-1 px-2">Buy</button>
                      <button className="button-secondary text-xs py-1 px-2">Sell</button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs">SOL</div>
                      <div>
                        <div className="asset-name">Solana</div>
                        <div className="asset-symbol">SOL</div>
                      </div>
                    </div>
                  </td>
                  <td>$98.76</td>
                  <td>58.4321 SOL</td>
                  <td>$5,770.53</td>
                  <td className="positive-value">+1.24%</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="button-success text-xs py-1 px-2">Buy</button>
                      <button className="button-secondary text-xs py-1 px-2">Sell</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
