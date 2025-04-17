import { LineChart, Line, Area, ResponsiveContainer } from 'recharts';
import '../styles/asset-chart.css';

type AssetChartProps = {
  data: Array<{ value: number }>;
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
    return <div className={className}>No data</div>;
  }

  return (
    <div
      className={className}
      style={{ width: '100px', height: '40px', position: 'relative' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#05c48a" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#05c48a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ea384d" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ea384d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Line
            type="natural"
            dataKey="value"
            stroke={isPositive ? '#05c48a' : '#ea384d'}
            strokeWidth={1.2}
            dot={false}
            activeDot={false}
            connectNulls={false}
            isAnimationActive={false}
          />
          <Area
            type="natural"
            dataKey="value"
            stroke="none"
            fillOpacity={0.15}
            fill={isPositive ? 'url(#colorPositive)' : 'url(#colorNegative)'}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
