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

export function formatArabicNumber(num: number, decimals: number = 2): string {
  if (num === null || num === undefined || isNaN(num)) return '٠';
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return toArabicDigits(formatted);
}
