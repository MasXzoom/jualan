/**
 * Utility functions for formatting data
 */

/**
 * Format a number as currency (IDR)
 * @param value - The number to format
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format a date as a localized string
 * @param date - Date to format
 * @param format - Optional format (short, medium, long)
 * @returns Formatted date string
 */
export const formatDate = (
  date: string | Date,
  format: 'short' | 'medium' | 'long' = 'medium'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: format === 'short' ? 'numeric' : 'long',
    day: 'numeric',
  };
  
  return dateObj.toLocaleDateString('id-ID', options);
};

/**
 * Format a number with thousand separators
 * @param value - The number to format
 * @returns Formatted number string
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('id-ID').format(value);
}; 