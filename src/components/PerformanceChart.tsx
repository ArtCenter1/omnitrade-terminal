import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
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
  // Log data to help debug
  console.log('Performance chart data:', data);

  // Create a simple dataset if the data is empty or invalid
  if (!data || data.length === 0) {
    data = [
      { date: 'Mon', value: 40000 },
      { date: 'Tue', value: 41000 },
      { date: 'Wed', value: 42000 },
      { date: 'Thu', value: 41500 },
      { date: 'Fri', value: 43000 },
      { date: 'Sat', value: 42500 },
      { date: 'Sun', value: 44000 },
    ];
    console.log('Using fallback data for chart');
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 30 }} // Add bottom margin for the time labels
          className="performance-chart"
          style={{
            overflow: 'visible',
          }}
        >
          <defs>
            <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isPositive ? '#00ff00' : '#ea384d'}
                stopOpacity={0.5}
              />
              <stop
                offset="30%"
                stopColor={isPositive ? '#00ff00' : '#ea384d'}
                stopOpacity={0.2}
              />
              <stop
                offset="80%"
                stopColor={isPositive ? '#00ff00' : '#ea384d'}
                stopOpacity={0.01}
              />
              <stop
                offset="80%"
                stopColor={isPositive ? '#00ff00' : '#ea384d'}
                stopOpacity={0}
              />
            </linearGradient>

            {/* Add a clipPath for the chart */}
            <clipPath id="chartClipPath">
              <rect x="0" y="0" width="100%" height="80%" />{' '}
              {/* Clip the bottom 20% (1/5) */}
            </clipPath>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false} // No visible axis line
            tickLine={false}
            tick={{ fill: '#666', fontSize: 10 }}
            tickFormatter={(value) => value.split('\n')[0]} // Show only MM-DD part
            interval={
              data.length > 50
                ? Math.floor(data.length / 8)
                : Math.floor(data.length / 6)
            } // Adjust tick count based on data size
            padding={{ left: 10, right: 10 }} // Add consistent padding
            minTickGap={5} // Allow some gap between ticks
            tickMargin={5} // Add small margin for better positioning
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 10 }}
            orientation="right"
            // Use a simpler approach with a fixed minimum value
            domain={[
              (dataMin: number) => Math.floor(dataMin * 0.95), // Start closer to the minimum value
              (dataMax: number) => Math.ceil(dataMax * 1.01), // End closer to the top
            ]} // Set domain with better visualization
            tickCount={5} // Show 5 price levels on Y-axis to match reference
            tickFormatter={(value) =>
              `$${value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
            } // Format as currency with commas
            padding={{ top: 10, bottom: 10 }} // Add consistent padding to match X-axis
            minTickGap={5} // Match X-axis settings
            tickMargin={5} // Match X-axis settings
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
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? '#00ff00' : '#ea384d'}
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPerformance)"
            dot={false}
            activeDot={{
              r: 4,
              strokeWidth: 0,
              fill: isPositive ? '#00ff00' : '#ea384d',
            }}
            connectNulls={true}
            isAnimationActive={false} // Disable animation for immediate rendering
            baseValue={0} // Ensure the area extends to the bottom
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
