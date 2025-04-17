import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import '../styles/performance-chart.css';

type PerformanceChartProps = {
  data: Array<{ date: string; value: number }>;
  isPositive: boolean;
  className?: string;
};

export function PerformanceChart({
  data = [],
  isPositive,
  className = 'performance-chart-container h-full',
}: PerformanceChartProps) {
  // Ensure we have valid data before rendering the chart
  if (!data || data.length === 0) {
    return <div className={className}>No data available</div>;
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
          className="performance-chart"
        >
          <defs>
            <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isPositive ? '#05c48a' : '#ea384d'}
                stopOpacity={0.2}
              />
              <stop
                offset="95%"
                stopColor={isPositive ? '#05c48a' : '#ea384d'}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 10 }}
            tickFormatter={(value) => value.split('\n')[0]} // Show only MM-DD part
            interval={Math.floor(data.length / 6)} // Show 6 ticks to match reference
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 10 }}
            orientation="right"
            // Use a simpler approach with a fixed minimum value
            domain={[
              (dataMin: number) => Math.floor(dataMin * 0.7), // Start much lower to show more leg room
              (dataMax: number) => Math.ceil(dataMax * 1.05),
            ]} // Set domain with lower minimum for better visualization
            tickCount={5} // Show 5 price levels on Y-axis to match reference
            tickFormatter={(value) =>
              `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
            } // Format as currency with commas
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111',
              borderColor: '#333',
              borderRadius: '4px',
            }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#999' }}
          />
          <Line
            type="natural"
            dataKey="value"
            stroke={isPositive ? '#05c48a' : '#ea384d'}
            strokeWidth={1.2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            connectNulls={false}
            isAnimationActive={false} // Disable animation for immediate rendering
          />
          <Area
            type="natural"
            dataKey="value"
            stroke="none"
            fillOpacity={0.15}
            fill="url(#colorPerformance)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
