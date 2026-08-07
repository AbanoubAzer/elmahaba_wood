export function toArabicDigits(str: string | number): string {
  if (str === null || str === undefined) return '';
  const strVal = String(str);
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return strVal.replace(/[0-9]/g, (d) => arabicDigits[parseInt(d, 10)]);
}

export function formatArabicDate(dateStr?: string | Date): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return toArabicDigits(d.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' }));
}

export function formatArabicNumber(num: number, decimals: number = 2): string {
  if (num === null || num === undefined || isNaN(num)) return '٠';
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return toArabicDigits(formatted);
}
