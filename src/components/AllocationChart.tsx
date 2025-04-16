import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

type AllocationChartProps = {
  data: Array<{
    name: string;
    value: number;
    color: string;
    // Additional data for the tooltip
    usdValue?: string;
    price?: string;
    amount?: string;
    symbol?: string;
    displayName?: string;
  }>;
  className?: string;
};

// Custom tooltip component for the allocation chart
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const symbol = data.symbol || data.name;
    const displayName = data.displayName || data.name;

    // Format currency values
    const formatCurrency = (value: string) => {
      return `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
      <div
        className="custom-tooltip"
        style={{
          backgroundColor: '#111',
          border: '1px solid #333',
          borderRadius: '4px',
          padding: '10px 14px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
          color: '#fff',
          fontSize: '14px',
          minWidth: '180px',
        }}
      >
        {/* Header with symbol and percentage */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                fontWeight: 'bold',
                color: data.color,
                marginRight: '8px',
              }}
            >
              {symbol}
            </span>
            <span style={{ color: '#999' }}>{displayName}</span>
          </div>
          <span style={{ fontWeight: 'bold' }}>
            {`(${data.value.toFixed(1)}%)`}
          </span>
        </div>

        {/* Value */}
        {data.usdValue && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              margin: '4px 0',
            }}
          >
            <span style={{ color: '#999' }}>Value:</span>
            <span>{formatCurrency(data.usdValue)}</span>
          </div>
        )}

        {/* Price */}
        {data.price && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              margin: '4px 0',
            }}
          >
            <span style={{ color: '#999' }}>Price:</span>
            <span>{formatCurrency(data.price)}</span>
          </div>
        )}

        {/* Amount */}
        {data.amount && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              margin: '4px 0',
            }}
          >
            <span style={{ color: '#999' }}>Amount:</span>
            <span>{data.amount}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export function AllocationChart({
  data = [],
  className = 'pie-chart-container',
}: AllocationChartProps) {
  // Ensure we have valid data before rendering the chart
  if (!data || data.length === 0) {
    return <div className={className}>No allocation data</div>;
  }

  // Calculate total percentage (should be 100% but let's make sure)
  // const totalPercentage = data.reduce((sum, item) => sum + item.value, 0);

  // Find the asset with the highest allocation
  const topAsset =
    data.length > 0
      ? data.reduce((prev, current) =>
          prev.value > current.value ? prev : current,
        )
      : null;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip />}
            wrapperStyle={{ outline: 'none' }} // Remove focus outline
            isAnimationActive={false} // Disable animation for better performance
          />

          {/* Center label showing top asset */}
          {topAsset && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                fill: topAsset.color,
              }}
            >
              {topAsset.symbol || topAsset.name}
            </text>
          )}

          {/* Percentage below */}
          {topAsset && (
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fontSize: '11px',
                fill: '#fff',
              }}
            >
              {`${topAsset.value.toFixed(0)}%`}
            </text>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
