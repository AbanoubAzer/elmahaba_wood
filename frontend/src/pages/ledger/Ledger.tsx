import { BookOpen, Calendar, Filter, Printer } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useCustomerSupplierStore } from '../../store/customerSupplierStore';
import { formatArabicNumber, formatArabicDate } from '../../utils/numberUtils';
import { SmartDateFilters } from '../../components/ui/SmartDateFilters';

export const Ledger: React.FC = () => {
  const { ledgerEntries } = useCustomerSupplierStore();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all');

  const filteredEntries = useMemo(() => {
    let result = ledgerEntries;
    
    if (filterType !== 'all') {
      result = result.filter(e => e.partyType === filterType);
    }
    
    if (startDate) {
      result = result.filter(e => e.date >= startDate);
    }
    
    if (endDate) {
      result = result.filter(e => e.date <= endDate);
    }

    // Sort descending by date and time (fallback to ID to maintain stable sort)
    return result.sort((a, b) => {
      const dateCmp = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCmp !== 0) return dateCmp;
      return b.id.localeCompare(a.id);
    });
  }, [ledgerEntries, startDate, endDate, filterType]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" />
            <span>كشوف الحسابات الموحدة (دفتر اليومية العام)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مراجعة كافة الحركات المالية والمخزنية لجميع العملاء والموردين في مكان واحد.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة السجل</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-4 print:hidden">
        <div className="flex flex-col gap-3 flex-1">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-600 text-xs">من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-600 text-xs">إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none outline-none"
              >
                <option value="all">الكل (عملاء وموردين)</option>
                <option value="customer">العملاء فقط</option>
                <option value="supplier">الموردين فقط</option>
              </select>
            </div>
            
            {(startDate || endDate || filterType !== 'all') && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setFilterType('all');
                }}
                className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition-all"
              >
                إلغاء الفلترة
              </button>
            )}
          </div>
          
          <SmartDateFilters 
            onSelect={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }} 
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[600px] print:h-auto print:border-none print:shadow-none print:w-full">
        <style>
          {`
            @media print {
              @page { size: landscape; margin: 10mm; }
              body { -webkit-print-color-adjust: exact; }
            }
          `}
        </style>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 print:bg-white print:border-b-2 print:border-black">
              <tr>
                <th className="px-4 py-3">التاريخ</th>
                <th className="px-4 py-3">النوع</th>
                <th className="px-4 py-3">الاسم (الجهة)</th>
                <th className="px-4 py-3">البيان</th>
                <th className="px-4 py-3 text-center">مدين (+)</th>
                <th className="px-4 py-3 text-center">دائن (-)</th>
                <th className="px-4 py-3 text-center">رصيد الحساب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 print:divide-black">
              {filteredEntries.map((row: any) => (
                <tr key={row.id} className="hover:bg-slate-50 transition-colors print:hover:bg-white">
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-500">
                    {formatArabicDate(row.date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                      row.partyType === 'customer' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200 print:border-none'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200 print:border-none'
                    }`}>
                      {row.partyType === 'customer' ? 'عميل' : 'مورد'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-800 text-sm">
                    {row.partyName}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-slate-600 max-w-xs truncate" title={row.description}>
                    {row.description}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-rose-600">
                    {row.debit > 0 ? formatArabicNumber(row.debit, 0) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-emerald-600">
                    {row.credit > 0 ? formatArabicNumber(row.credit, 0) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center font-black text-slate-900 bg-slate-50/50 print:bg-white">
                    {formatArabicNumber(row.balance, 0)}
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500 font-bold">
                    لا توجد حركات مالية مسجلة في هذه الفترة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
