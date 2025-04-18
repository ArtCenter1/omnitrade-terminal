import { LineChart, Line, ResponsiveContainer } from 'recharts';
import '../styles/dashboard-chart.css';

type DashboardAssetChartProps = {
  data: number[] | Array<{ value: number }>;
  isPositive: boolean;
  className?: string;
};

/**
 * A specialized chart component for the dashboard assets
 * This is separate from the main AssetChart to avoid affecting the terminal page
 */
export function DashboardAssetChart({
  data = [],
  isPositive,
  className = 'dashboard-chart-container',
}: DashboardAssetChartProps) {
  // Ensure we have valid data before rendering the chart
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full min-w-[140px] min-h-[60px] bg-gray-800 flex items-center justify-center text-xs text-gray-500">
        No data
      </div>
    );
  }

  // Determine if the data is an array of numbers or an array of objects
  const isNumberArray = typeof data[0] === 'number';

  // Convert the data to the format expected by Recharts
  const chartData = isNumberArray
    ? (data as number[]).map((value, index) => ({ index, value }))
    : (data as Array<{ value: number }>);

  return (
    <div
      className={`w-full h-full min-w-[140px] min-h-[60px] relative ${className}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <Line
            type="natural"
            dataKey="value"
            stroke={isPositive ? '#05c48a' : '#ea384d'}
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
