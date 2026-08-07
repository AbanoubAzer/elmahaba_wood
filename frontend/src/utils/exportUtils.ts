import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Excel Export ─────────────────────────────────────────────────────────
export function exportToExcel(
  data: Record<string, any>[],
  filename: string,
  sheetName = 'بيانات'
) {
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto column widths
  const cols = Object.keys(data[0] ?? {}).map((key) => ({
    wch: Math.max(
      key.length,
      ...data.map((r) => String(r[key] ?? '').length)
    ) + 2,
  }));
  ws['!cols'] = cols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── PDF Export ───────────────────────────────────────────────────────────
export function exportToPdf(
  columns: { header: string; dataKey: string }[],
  rows: Record<string, any>[],
  title: string,
  subtitle?: string
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, doc.internal.pageSize.width / 2, 15, { align: 'center' });

  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, doc.internal.pageSize.width / 2, 22, { align: 'center' });
  }

  autoTable(doc, {
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(row[c.dataKey] ?? ''))),
    startY: subtitle ? 28 : 22,
    styles: {
      fontSize: 9,
      cellPadding: 3,
      halign: 'center',
    },
    headStyles: {
      fillColor: [30, 30, 50],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 248, 252] },
  });

  // Footer with date
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `${new Date().toLocaleDateString('ar-EG')} — صفحة ${i} من ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 8,
      { align: 'center' }
    );
  }

  doc.save(`${title}.pdf`);
}

// ─── Ledger-specific helpers ───────────────────────────────────────────────
export function exportLedgerToExcel(
  entries: any[],
  partyName: string,
  period?: string
) {
  const data = entries.map((e, i) => ({
    '#': i + 1,
    التاريخ: e.date,
    البيان: e.description,
    'المواصفات': e.woodSpecs ?? '',
    'الحجم م³': e.volumeM3 ?? '',
    'مدين (عليه)': e.debit > 0 ? e.debit.toLocaleString() : '',
    'دائن (له)': e.credit > 0 ? e.credit.toLocaleString() : '',
    'الرصيد': Math.abs(e.balance).toLocaleString(),
    ملاحظات: e.notes ?? '',
  }));

  exportToExcel(
    data,
    `كشف حساب ${partyName}${period ? ' ' + period : ''}`,
    'كشف الحساب'
  );
}

export function exportLedgerToPdf(
  entries: any[],
  partyName: string,
  period?: string
) {
  const columns = [
    { header: '#', dataKey: 'idx' },
    { header: 'التاريخ', dataKey: 'date' },
    { header: 'البيان', dataKey: 'description' },
    { header: 'مدين', dataKey: 'debit' },
    { header: 'دائن', dataKey: 'credit' },
    { header: 'الرصيد', dataKey: 'balance' },
  ];

  const rows = entries.map((e, i) => ({
    idx: i + 1,
    date: e.date,
    description: e.description,
    debit: e.debit > 0 ? e.debit.toLocaleString() : '-',
    credit: e.credit > 0 ? e.credit.toLocaleString() : '-',
    balance: Math.abs(e.balance).toLocaleString(),
  }));

  exportToPdf(
    columns,
    rows,
    `كشف حساب — ${partyName}`,
    period
  );
}
