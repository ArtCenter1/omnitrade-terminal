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
    // Ensure we have string values
    const symbol = String(data.symbol || data.name || '');
    const displayName = String(data.displayName || data.name || '');

    // Format currency values with safety checks
    const formatCurrency = (value: string | number | undefined) => {
      if (value === undefined || value === null) return '$0.00';
      const numValue =
        typeof value === 'string' ? parseFloat(value) : Number(value);
      return `$${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
            {(() => {
              try {
                // Handle both number and string values safely
                const numValue =
                  typeof data.value === 'number'
                    ? data.value
                    : parseFloat(String(data.value || 0));

                // Check for NaN and return a valid percentage
                return `(${isNaN(numValue) ? '0.0' : numValue.toFixed(1)}%)`;
              } catch (e) {
                return '(0.0%)';
              }
            })()}
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

  // Clean and validate the data to prevent NaN issues
  const cleanedData = data
    .map((item) => ({
      ...item,
      // Ensure value is a valid number
      value:
        typeof item.value === 'number' &&
        !isNaN(item.value) &&
        isFinite(item.value)
          ? Math.max(0, item.value) // Ensure it's not negative
          : 0,
    }))
    .filter((item) => item.value > 0); // Only include items with positive values

  // If we have no valid data after cleaning, show a message
  if (cleanedData.length === 0) {
    console.warn('No valid allocation data after cleaning:', data);
    return <div className={className}>No valid allocation data</div>;
  }

  // Log the cleaned data for debugging
  console.log('Cleaned allocation data:', cleanedData);

  // Find the asset with the highest allocation
  const topAsset = cleanedData.reduce(
    (prev, current) => (prev.value > current.value ? prev : current),
    cleanedData[0],
  );

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
            data={cleanedData}
            cx="50%"
            cy="50%"
            innerRadius="35%"
            outerRadius="70%"
            paddingAngle={1}
            dataKey="value"
            stroke="none" // Remove the white border around segments
            onClick={undefined} // Disable click behavior to prevent selection border
            style={{ outline: 'none', stroke: 'none' }} // Additional styling to remove borders
            isAnimationActive={false} // Disable animations which can cause flickering
            className="allocation-pie"
          >
            {cleanedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || '#8884d8'} // Provide fallback color
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
          {cleanedData.length > 0 && cleanedData[0].totalPortfolioValue && (
            <g>
              {/* Total label */}
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fontSize: '0.8rem',
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
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  fill: '#fff',
                }}
              >
                {(() => {
                  try {
                    // Safely parse the value with error handling
                    const rawValue = cleanedData[0].totalPortfolioValue;

                    // Handle undefined, null, or empty string
                    if (
                      rawValue === undefined ||
                      rawValue === null ||
                      rawValue === ''
                    ) {
                      return '$0';
                    }

                    // Try to parse the value
                    const value =
                      typeof rawValue === 'string'
                        ? parseFloat(rawValue)
                        : Number(rawValue);

                    // Check for NaN or invalid numbers
                    if (isNaN(value) || !isFinite(value)) {
                      return '$0';
                    }

                    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                  } catch (error) {
                    console.error(
                      'Error formatting total portfolio value:',
                      error,
                    );
                    return '$0';
                  }
                })()}
              </text>
            </g>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
