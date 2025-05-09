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
          margin={{ top: 10, right: 10, left: 10, bottom: 32 }} // Adjust bottom margin for 1.2x font size
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
            tick={{ fill: '#666', fontSize: 12 }}
            tickFormatter={(value) => {
              // For Week view, only show the day part (Mon, Tue, etc.)
              if (value.includes(' ')) {
                return value.split(' ')[0]; // Return just the day name
              }
              return value.split('\n')[0]; // For other views, show as before
            }}
            // For Week view, force exactly 7 ticks by using a custom interval function
            interval={(index, data) => {
              // For Week view with ultra-high sample rate (2016 data points), show exactly 7 days
              if (data.length > 2000) {
                // Only show the first point of each day (index % 288 === 0)
                // This ensures we get exactly 7 ticks, one for each day
                return index % 288 === 0 ? 0 : 1;
              }
              // For Week view with medium sample rate (168 data points)
              else if (data.length > 160) {
                // Only show the first hour of each day (index % 24 === 0)
                return index % 24 === 0 ? 0 : 1;
              }
              // For other views, use the original calculation
              return data.length > 50
                ? Math.floor(data.length / 8)
                : Math.floor(data.length / 6);
            }}
            padding={{ left: 10, right: 10 }} // Add consistent padding
            minTickGap={6} // Adjust gap for 1.2x font size
            tickMargin={6} // Adjust margin for 1.2x font size
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 12 }}
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
            minTickGap={6} // Adjust gap for 1.2x font size
            tickMargin={6} // Adjust margin for 1.2x font size
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
            type="linear"
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
