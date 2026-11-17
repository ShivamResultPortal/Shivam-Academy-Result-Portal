/**
 * Formats numeric marks to the standard 000.00 format (padded to 3 integer digits with 2 decimal places).
 * Examples:
 *  - 0 -> "000.00"
 *  - 5 -> "005.00"
 *  - 45.5 -> "045.50"
 *  - 100 -> "100.00"
 *  - 999.99 -> "999.99"
 */
export function formatMarks(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '000.00';
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return '000.00';

  // Ensure value doesn't exceed 999.99 max bound
  const clamped = Math.max(0, Math.min(999.99, num));

  // Format to 2 decimal places
  const fixed = clamped.toFixed(2);
  const [intPart, decPart] = fixed.split('.');

  // Pad integer part to 3 digits (e.g. 5 -> "005", 50 -> "050")
  const paddedInt = intPart.padStart(3, '0');
  return `${paddedInt}.${decPart}`;
}
