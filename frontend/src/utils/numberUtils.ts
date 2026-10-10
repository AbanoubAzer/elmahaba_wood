export function toArabicDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  const strVal = String(str);
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return strVal.replace(/[0-9]/g, (d) => arabicDigits[parseInt(d, 10)]);
}

/**
 * Returns today's date in Egypt timezone (Africa/Cairo) formatted as YYYY-MM-DD
 */
export function getEgyptToday(date: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch (e) {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Formats a date or timestamp in Egypt timezone (Africa/Cairo) in Arabic digits
 */
export function formatArabicDate(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return toArabicDigits(
    d.toLocaleDateString('ar-EG', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  );
}

/**
 * Formats date and time in Egypt timezone (Africa/Cairo) in Arabic digits
 */
export function formatArabicDateTime(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return toArabicDigits(
    d.toLocaleString('ar-EG', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  );
}

/**
 * Formats a number with Arabic numerals and thousands separators.
 * By default, trims redundant trailing zeros (e.g. 1 instead of 1.0000, 1.5 instead of 1.5000).
 */
export function formatArabicNumber(
  num: number | string,
  decimals: number = 2,
  trimTrailingZeros: boolean = true,
): string {
  if (num === null || num === undefined) return '٠';
  const n = typeof num === 'number' ? num : Number(num);
  if (isNaN(n)) return '٠';

  const formatted = n.toLocaleString('en-US', {
    minimumFractionDigits: trimTrailingZeros ? 0 : decimals,
    maximumFractionDigits: decimals,
  });
  return toArabicDigits(formatted);
}

/**
 * Formats cubic meters volume (m³) up to 4 decimal places without redundant trailing zeros.
 * e.g. 1 -> '١', 1.5 -> '١.٥', 7.5222 -> '٧.٥٢٢٢'
 */
export function formatVolume(num: number | string): string {
  return formatArabicNumber(num, 4, true);
}

