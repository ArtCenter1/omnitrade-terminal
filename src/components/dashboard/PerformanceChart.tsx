import React from 'react';
import { Info } from 'lucide-react';

interface PerformanceChartProps {
  // In a real implementation, this would include chart data
  // For now, we'll just mock the UI
}

const PerformanceChart: React.FC<PerformanceChartProps> = () => {
  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <span>Performance</span>
          <Info size={16} className="text-theme-tertiary cursor-help" />
        </div>
        
        <div className="time-period-tabs">
          <button className="time-period-tab">Day</button>
          <button className="time-period-tab active">Week</button>
          <button className="time-period-tab">Month</button>
          <button className="time-period-tab">Year</button>
          <button className="time-period-tab">5 Years</button>
        </div>
      </div>
      
      {/* Chart placeholder - in a real implementation, this would be a chart component */}
      <div className="w-full h-64 bg-theme-chart rounded-md flex items-center justify-center">
        <div className="text-theme-tertiary">
          Chart would be rendered here with actual data
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
