import { LineChart, Line, ResponsiveContainer } from 'recharts';
import '../styles/asset-chart.css';

type AssetChartProps = {
  data: number[] | Array<{ value: number }>;
  isPositive: boolean;
  className?: string;
};

export function AssetChart({
  data = [],
  isPositive,
  className = 'chart-container',
}: AssetChartProps) {
  // Ensure we have valid data before rendering the chart
  if (!data || data.length === 0) {
    return <div className="w-[100px] h-[40px] bg-gray-800">No data</div>;
  }

  // Determine if the data is an array of numbers or an array of objects
  const isNumberArray = typeof data[0] === 'number';

  // Convert the data to the format expected by Recharts
  const chartData = isNumberArray
    ? (data as number[]).map((value, index) => ({ index, value }))
    : (data as Array<{ value: number }>);

  return (
    <div className="w-[100px] h-[40px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="natural"
            dataKey="value"
            stroke={isPositive ? '#05c48a' : '#ea384d'}
            strokeWidth={1.2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
