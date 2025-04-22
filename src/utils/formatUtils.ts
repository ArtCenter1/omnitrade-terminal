/**
 * Formats a number using toLocaleString with basic options.
 * @param value The number to format.
 * @returns The formatted number string.
 */
export function formatNumber(value: number): string {
  // Basic implementation, can be refined with more specific options
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2, // Example: Ensure at least 2 decimal places
    maximumFractionDigits: 8, // Example: Allow up to 8 decimal places for precision
  });
}

/**
 * Formats a number as currency using toLocaleString.
 * @param value The amount to format.
 * @param currency The currency code (defaults to 'USD').
 * @returns The formatted currency string.
 */
export function formatCurrency(
  value: number,
  currency: string = 'USD',
): string {
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2, // Standard for most currencies
    maximumFractionDigits: 2, // Standard for most currencies
  });
}
