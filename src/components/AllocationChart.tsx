import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import '../styles/allocation-chart.css';

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
    // Total portfolio value (only on the first item)
    totalPortfolioValue?: string;
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

  // Log the top asset for debugging
  console.log('Top asset in allocation chart:', topAsset);

  // Add a style to remove any outlines or borders
  const containerStyle = {
    outline: 'none',
    border: 'none',
    position: 'relative' as 'relative',
    width: '100%',
    height: '100%',
  };

  return (
    <div className={className} style={containerStyle}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart style={{ outline: 'none' }} onClick={undefined}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={1}
            dataKey="value"
            stroke="none" // Remove the white border around segments
            onClick={undefined} // Disable click behavior to prevent selection border
            style={{ outline: 'none', stroke: 'none' }} // Additional styling to remove borders
            isAnimationActive={false} // Disable animations which can cause flickering
            className="allocation-pie"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="none" // Remove the white border for each cell
              />
            ))}
          </Pie>
          <Tooltip
            content={<CustomTooltip />}
            wrapperStyle={{ outline: 'none' }} // Remove focus outline
            isAnimationActive={false} // Disable animation for better performance
          />

          {/* Center label showing total portfolio value */}
          {data.length > 0 && data[0].totalPortfolioValue && (
            <g>
              {/* Total label */}
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: '12px',
                  fontWeight: 'normal',
                  fill: '#999',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}
              >
                Total
              </text>

              {/* Total value */}
              <text
                x="50%"
                y="60%"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  fill: '#fff',
                }}
              >
                {`$${Number(data[0].totalPortfolioValue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              </text>
            </g>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
