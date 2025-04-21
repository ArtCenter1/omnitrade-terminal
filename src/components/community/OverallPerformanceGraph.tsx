import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import '@/styles/community-charts.css';

// Placeholder data simulating performance distribution
// 'range' represents the PNL bucket, 'count' is the number of bots in that range
const performanceData = [
  { range: '-3k', count: 150 },
  { range: '-2k', count: 300 },
  { range: '-1k', count: 500 },
  { range: '0', count: 800 }, // Break-even point
  { range: '1k', count: 1200 },
  { range: '2k', count: 950 }, // Peak performance area
  { range: '3k', count: 700 },
  { range: '4k', count: 400 },
  { range: '5k', count: 200 },
  { range: '6k+', count: 100 },
];

// Placeholder for the user's bot performance to highlight
const userBotPnlRange = '2k'; // Example: User's bot falls in the 2k range

export function OverallPerformanceGraph() {
  return (
    <Card className="community-card">
      <CardHeader>
        <CardTitle>My Bot vs. Field</CardTitle>
        <CardDescription>
          Performance distribution across all participants.
        </CardDescription>
        {/* Optional: Add specific rank like "#3665 of 4507" if data is available */}
      </CardHeader>
      <CardContent className="h-64 relative community-chart-container">
        {/* Using relative positioning to contain the chart */}
        <ResponsiveContainer
          width="100%"
          height="100%"
          className="community-bar-chart"
        >
          <BarChart
            data={performanceData}
            margin={{ top: 5, right: 20, left: -20, bottom: 5 }} // Adjust margins
            barCategoryGap="10%" // Gap between bars
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#444"
              vertical={false}
            />{' '}
            {/* Faint horizontal grid */}
            <XAxis
              dataKey="range"
              tick={{ fontSize: 10, fill: '#9ca3af' }} // Style X-axis labels
              axisLine={false} // Hide X-axis line
              tickLine={false} // Hide X-axis ticks
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }} // Style Y-axis labels
              axisLine={false} // Hide Y-axis line
              tickLine={false} // Hide Y-axis ticks
              width={40} // Adjust width for labels
            />
            <Tooltip
              cursor={{ fill: 'rgba(100, 100, 100, 0.2)' }} // Tooltip background on hover
              contentStyle={{
                backgroundColor: '#1f2937',
                border: 'none',
                borderRadius: '4px',
              }} // Tooltip style
              labelStyle={{ color: '#e5e7eb' }}
              itemStyle={{ color: '#9ca3af' }}
            />
            <Bar dataKey="count" name="Bots in Range" fill="#dc2626">
              {' '}
              {/* Default bar color (red) */}
              {performanceData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.range === userBotPnlRange ? '#22c55e' : '#dc2626'}
                /> // Highlight user's range (green)
              ))}
            </Bar>
            {/* Optional: Add a ReferenceLine for the zero point if needed */}
            {/* <ReferenceLine x="0" stroke="#6b7280" strokeDasharray="3 3" /> */}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
