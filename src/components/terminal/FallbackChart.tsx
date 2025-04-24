import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { TradingPair } from '@/types/trading';

// Generate mock price data for the chart
const generateMockData = (basePrice: number, dataPoints = 100) => {
  const data = [];
  let price = basePrice;

  // Generate random price movements
  for (let i = 0; i < dataPoints; i++) {
    // Random walk with slight upward bias
    const change = (Math.random() - 0.48) * (price * 0.01);
    price += change;

    data.push({
      time: new Date(Date.now() - (dataPoints - i) * 15 * 60000).toISOString(),
      price: Math.max(price, 0.01), // Ensure price doesn't go below 0.01
    });
  }

  return data;
};

interface FallbackChartProps {
  selectedPair?: TradingPair;
}

export function FallbackChart({ selectedPair }: FallbackChartProps) {
  // Default timeframe is daily
  const timeframe = 'D';
  // Default to BTC price if no pair is selected
  const basePrice = selectedPair?.price
    ? parseFloat(selectedPair.price)
    : 90000;

  // Generate mock data based on the selected pair's price
  const data = React.useMemo(() => generateMockData(basePrice), [basePrice]);

  // Format the time based on the selected timeframe
  const formatTime = (time: string) => {
    const date = new Date(time);

    switch (timeframe) {
      case '1':
      case '5':
      case '15':
      case '30':
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
      case '60':
      case '240':
        return `${date.getHours()}:00`;
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ backgroundColor: '#131722' }}
    >
      <div className="p-4 text-white">
        <h3 className="text-lg font-medium">
          {selectedPair
            ? `${selectedPair.baseAsset}/${selectedPair.quoteAsset}`
            : 'BTC/USDT'}{' '}
          Chart
        </h3>
        <p className="text-sm text-gray-400">
          Fallback chart - TradingView unavailable
        </p>
      </div>

      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
          >
            <XAxis
              dataKey="time"
              tickFormatter={formatTime}
              stroke="#555"
              tick={{ fill: '#999' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#555"
              tick={{ fill: '#999' }}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => formatTime(label as string)}
              contentStyle={{
                backgroundColor: '#1e222d',
                borderColor: '#555',
                color: '#fff',
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#05c48a"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="p-2 flex justify-center">
        <div className="flex space-x-2">
          {['1m', '5m', '15m', '1h', '4h', '1d', '1w'].map((tf) => (
            <button
              key={tf}
              className={`px-3 py-1 rounded text-xs ${
                (tf === '1m' && timeframe === '1') ||
                (tf === '5m' && timeframe === '5') ||
                (tf === '15m' && timeframe === '15') ||
                (tf === '1h' && timeframe === '60') ||
                (tf === '4h' && timeframe === '240') ||
                (tf === '1d' && timeframe === 'D') ||
                (tf === '1w' && timeframe === 'W')
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
