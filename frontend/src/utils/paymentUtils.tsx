// ─── Shared payment method badge utility ──────────────────────────
// Used in CustomerStatement.tsx and SupplierStatement.tsx
import React from 'react';
import type { Invoice, LedgerEntry } from '../types';

export function getPaymentMethodBadge(inv?: Invoice | null, row?: LedgerEntry): React.ReactElement {
  const method = inv?.paymentMethod || '';
  const notesStr = `${row?.notes || ''} ${inv?.notes || ''} ${row?.description || ''}`;

  if (notesStr.includes('وسائل السداد:')) {
    const splitPart = notesStr.split('وسائل السداد:')[1]?.split('|')[0] || '';
    return (
      <span className="bg-indigo-50 text-indigo-900 border border-indigo-200 text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1">
        💳 {splitPart.trim()}
      </span>
    );
  }
  if (method === 'instapay' || notesStr.includes('انستا باي') || notesStr.includes('InstaPay')) {
    return <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1">⚡ انستا باي</span>;
  }
  if (method === 'bank_transfer' || notesStr.includes('تحويل بنكي')) {
    return <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1">🏦 تحويل بنكي</span>;
  }
  if (method === 'vodafone_cash' || notesStr.includes('محفظة')) {
    return <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1">📱 محفظة</span>;
  }
  if (method === 'check' || notesStr.includes('شيك')) {
    return <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1">📄 شيك بنكي</span>;
  }
  return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-md inline-flex items-center gap-1">💵 نقداً (كاش)</span>;
}
