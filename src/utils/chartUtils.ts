// Utility functions for generating chart data

/**
 * Generates 7-day chart data for an asset
 * @param symbol Asset symbol to generate data for
 * @param isPositive Whether the trend should be positive
 * @returns Array of data points for the chart
 */
export function generate7DayChartData(
  symbol: string,
  isPositive: boolean = false,
): Array<{ value: number }> {
  // Use the symbol to generate a consistent random seed
  const seed = symbol
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  // Determine if the trend should be positive based on the seed if not specified
  const trend = isPositive ? 1 : -1;

  // Generate more data points for a smoother, more realistic chart
  // We'll use 24 points (roughly 4 per day) to match the reference image
  const data = [];
  const startValue = 10;
  const volatility = 0.4; // Lower volatility for more realistic movements

  let currentValue = startValue;

  // Generate 24 points for a more detailed chart
  for (let i = 0; i < 24; i++) {
    // Use the seed to create deterministic but seemingly random values
    // Add variation based on point position to create realistic patterns
    const randomFactor =
      Math.sin(seed + i * 3.7) * volatility * (1 + Math.cos(i * 0.4) * 0.5);

    // Add trend bias (gradually increase/decrease based on trend)
    const trendFactor = (i / 23) * trend * 2;

    // Add some small market cycles (ups and downs)
    const cycleFactor = Math.sin(i * 0.7 + seed * 0.1) * 0.4;

    // Update current value with all factors
    currentValue = startValue + randomFactor + trendFactor + cycleFactor;

    // Ensure value stays positive and reasonable
    currentValue = Math.max(currentValue, startValue * 0.7);

    // Add occasional small spikes to simulate market events (but keep them subtle)
    if (i % 6 === 3) {
      const spikeDirection = Math.sin(seed + i) > 0 ? 1 : -1;
      currentValue += spikeDirection * volatility * 0.6;
    }

    data.push({ value: currentValue });
  }

  return data;
}
