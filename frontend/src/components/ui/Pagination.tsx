import React from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { toArabicDigits } from '../../utils/numberUtils';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-xs ${className}`} dir="rtl">
      <span className="text-xs sm:text-sm text-slate-600 font-medium">
        عرض <strong className="text-slate-900 font-bold">{toArabicDigits(from)}–{toArabicDigits(to)}</strong> من إجمالي <strong className="text-slate-900 font-bold">{toArabicDigits(totalItems)}</strong> سجل
      </span>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="الصفحة السابقة"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-slate-400 font-bold">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`min-w-8 h-8 px-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                p === currentPage
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {toArabicDigits(p)}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          title="الصفحة التالية"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/** Hook for pagination state */
export function usePagination(totalItems: number, pageSize = 20) {
  const [currentPage, setCurrentPage] = React.useState(1);

  const paginated = React.useCallback(
    (items: any[]): any[] => {
      const start = (currentPage - 1) * pageSize;
      return items.slice(start, start + pageSize);
    },
    [currentPage, pageSize]
  );

  const resetPage = () => setCurrentPage(1);

  return { currentPage, setCurrentPage, paginated, resetPage, totalItems };
}
