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

  // Calculate min, max, and range of values to check if there's enough variation
  if (data && data.length > 0) {
    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const percentRange = (range / avgValue) * 100;

    console.log(`Chart data statistics:
      Min value: ${min}
      Max value: ${max}
      Range: ${range}
      Average value: ${avgValue.toFixed(2)}
      Range as % of average: ${percentRange.toFixed(2)}%
    `);

    // Log a sample of values (one per day) to check the pattern
    if (data.length > 24) {
      const sampleValues = [];
      for (let i = 0; i < data.length; i += 24) {
        if (i < data.length) {
          sampleValues.push(data[i]);
        }
      }
      console.log('Sample values (one per day):', sampleValues);
    }
  }

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
            // For Week view, ensure we show appropriate ticks based on data length
            interval={
              // Use a number value instead of a function to fix the type error
              // This will show every Nth tick, where N is the calculated value
              (() => {
                // For hourly week view (168 data points), show only the midnight points (one per day)
                if (data.length >= 160 && data.length <= 170) {
                  // For 168 data points (24 hours * 7 days), show every 24th tick (once per day)
                  return 24;
                }
                // For standard week view (7 data points), show all ticks
                else if (data.length === 7) {
                  return 0; // Show all ticks (no skipping)
                }
                // For legacy Week view with ultra-high sample rate (2016 data points)
                else if (data.length > 2000) {
                  // For 2016 data points (288 points per day * 7 days), show every 288th tick
                  return 288;
                }
                // For other views, use the original calculation
                return data.length > 50
                  ? Math.floor(data.length / 8)
                  : Math.floor(data.length / 6);
              })()
            }
            padding={{ left: 10, right: 10 }} // Add consistent padding
            minTickGap={6} // Adjust gap for 1.2x font size
            tickMargin={6} // Adjust margin for 1.2x font size
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 12 }}
            orientation="right"
            // Use a more dynamic approach to show variations better
            domain={[
              (dataMin: number) => {
                // Calculate a better minimum value to show variations
                // Use 90% of the minimum value to show more of the chart's variations
                const min = Math.floor(dataMin * 0.9);
                console.log(
                  `YAxis domain min: original=${dataMin}, adjusted=${min}`,
                );
                return min;
              },
              (dataMax: number) => {
                // Add a little padding at the top
                const max = Math.ceil(dataMax * 1.05);
                console.log(
                  `YAxis domain max: original=${dataMax}, adjusted=${max}`,
                );
                return max;
              },
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
