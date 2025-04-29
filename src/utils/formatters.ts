/**
 * Utility functions for formatting numbers, currencies, and dates
 */

/**
 * Format a number with the specified number of decimal places
 * @param value The number to format
 * @param decimals The number of decimal places
 * @returns The formatted number as a string
 */
export function formatNumber(value?: number, decimals = 8): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }
  
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number as a currency
 * @param value The number to format
 * @param currency The currency code (default: 'USD')
 * @param decimals The number of decimal places
 * @returns The formatted currency as a string
 */
export function formatCurrency(value?: number, currency = 'USD', decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }
  
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a date
 * @param date The date to format
 * @param options The date formatting options
 * @returns The formatted date as a string
 */
export function formatDate(date?: Date | number, options?: Intl.DateTimeFormatOptions): string {
  if (!date) {
    return '-';
  }
  
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  
  return dateObj.toLocaleString(undefined, options || defaultOptions);
}

/**
 * Format a percentage
 * @param value The number to format as a percentage
 * @param decimals The number of decimal places
 * @returns The formatted percentage as a string
 */
export function formatPercentage(value?: number, decimals = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '-';
  }
  
  return value.toLocaleString(undefined, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}
