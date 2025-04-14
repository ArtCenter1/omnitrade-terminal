import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

type PerformanceChartProps = {
  data: Array<{ date: string; value: number }>;
  isPositive: boolean;
  className?: string;
}

export function PerformanceChart({ data = [], isPositive, className = "performance-chart-container" }: PerformanceChartProps) {
  // Ensure we have valid data before rendering the chart
  if (!data || data.length === 0) {
    return <div className={className}>No data available</div>;
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isPositive ? "#05c48a" : "#ea384d"} stopOpacity={0.2} />
              <stop offset="95%" stopColor={isPositive ? "#05c48a" : "#ea384d"} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 10 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#666', fontSize: 10 }}
            orientation="right"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111',
              borderColor: '#333',
              borderRadius: '4px'
            }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#999' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "#05c48a" : "#ea384d"}
            fillOpacity={1}
            fill="url(#colorPerformance)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
