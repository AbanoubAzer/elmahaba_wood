import React, { useState, useMemo } from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Wallet, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Printer 
} from 'lucide-react';
import { useCustomerSupplierStore } from '../../store/customerSupplierStore';
import { formatArabicNumber, formatArabicDate } from '../../utils/numberUtils';
import { SmartDateFilters } from '../../components/ui/SmartDateFilters';

export const CashFlow: React.FC = () => {
  const { customers, suppliers, ledgerEntries } = useCustomerSupplierStore();

  // Date Filtering State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Default to start of current month
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Quick Date Setters
  const setDateRange = (range: 'today' | 'week' | 'month') => {
    const to = new Date();
    const from = new Date();
    
    if (range === 'today') {
      // from is today
    } else if (range === 'week') {
      from.setDate(to.getDate() - 7);
    } else if (range === 'month') {
      from.setDate(1);
    }
    
    setStartDate(from.toISOString().split('T')[0]);
    setEndDate(to.toISOString().split('T')[0]);
  };

  // Balances Overview (Not filtered by date - Total Debts)
  const totalCustomersDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  }, [customers]);

  const totalSuppliersDebt = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.balance > 0 ? s.balance : 0), 0);
  }, [suppliers]);

  // Data processing based on date range
  const { collections, payments, totalCollected, totalPaid } = useMemo(() => {
    const filteredLedger = ledgerEntries.filter(e => {
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });

    // Collections from customers (Credit > 0, excluding discounts)
    const rawCollections = filteredLedger.filter(
      e => e.partyType === 'customer' && e.credit > 0 && !e.description.includes('خصم') && !e.description.includes('تسوية')
    );
    
    // Payments to suppliers (Debit > 0, excluding discounts)
    const rawPayments = filteredLedger.filter(
      e => e.partyType === 'supplier' && e.debit > 0 && !e.description.includes('خصم') && !e.description.includes('تسوية')
    );

    const collectedAmount = rawCollections.reduce((sum, item) => sum + item.credit, 0);
    const paidAmount = rawPayments.reduce((sum, item) => sum + item.debit, 0);

    // Sort by date descending
    rawCollections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    rawPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      collections: rawCollections,
      payments: rawPayments,
      totalCollected: collectedAmount,
      totalPaid: paidAmount
    };
  }, [ledgerEntries, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <style>
        {`
          @media print {
            @page { size: landscape; margin: 10mm; }
            body { -webkit-print-color-adjust: exact; }
          }
        `}
      </style>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-indigo-600" />
            <span>تقرير حركة الأموال (المقبوضات والمدفوعات)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            مقارنة بين التحصيلات من العملاء والمدفوعات للموردين خلال فترة زمنية محددة.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة التقرير</span>
        </button>
      </div>

      {/* Overview Cards (Overall Debts) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 flex items-center justify-between shadow-xs print:border-slate-300 print:shadow-none">
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">إجمالي الفلوس اللي بره (ديون العملاء)</p>
            <p className="text-2xl font-black text-emerald-600">{formatArabicNumber(totalCustomersDebt, 0)} ج.م</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 flex items-center justify-between shadow-xs print:border-slate-300 print:shadow-none">
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">إجمالي الفلوس اللي علينا (ديون الموردين)</p>
            <p className="text-2xl font-black text-rose-600">{formatArabicNumber(totalSuppliersDebt, 0)} ج.م</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex flex-col gap-3 flex-1 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
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
          </div>
          
          <SmartDateFilters 
            onSelect={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }} 
          />
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setDateRange('today')} className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100">اليوم</button>
          <button onClick={() => setDateRange('week')} className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100">هذا الأسبوع</button>
          <button onClick={() => setDateRange('month')} className="text-xs font-bold px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100">هذا الشهر</button>
        </div>
      </div>

      {/* Period Flow Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-500/20">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-emerald-50">إجمالي المحصل في الفترة</p>
            <ArrowDownToLine className="w-6 h-6 text-emerald-100" />
          </div>
          <p className="text-3xl font-black">{formatArabicNumber(totalCollected, 0)} ج.م</p>
          <p className="text-xs mt-2 text-emerald-100 font-medium">من العملاء</p>
        </div>
        
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-6 rounded-3xl text-white shadow-lg shadow-rose-500/20">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-rose-50">إجمالي المدفوع في الفترة</p>
            <ArrowUpFromLine className="w-6 h-6 text-rose-100" />
          </div>
          <p className="text-3xl font-black">{formatArabicNumber(totalPaid, 0)} ج.م</p>
          <p className="text-xs mt-2 text-rose-100 font-medium">للموردين</p>
        </div>

        <div className={`p-6 rounded-3xl text-white shadow-lg ${totalCollected >= totalPaid ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-indigo-600/20' : 'bg-gradient-to-br from-slate-700 to-slate-900 shadow-slate-700/20'}`}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-white/80">صافي التدفق (المحصل - المدفوع)</p>
            <Wallet className="w-6 h-6 text-white/80" />
          </div>
          <p className="text-3xl font-black" dir="ltr">{formatArabicNumber(totalCollected - totalPaid, 0)} ج.م</p>
          <p className="text-xs mt-2 text-white/70 font-medium">{totalCollected >= totalPaid ? 'فائض تحصيل' : 'عجز / مدفوعات أكثر'}</p>
        </div>
      </div>

      {/* Two Column Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collections Side */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[600px] print:h-auto print:border-none print:shadow-none">
          <div className="p-4 border-b border-slate-100 bg-emerald-50/50">
            <h3 className="font-bold text-emerald-900 flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
              تفاصيل التحصيلات من العملاء
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {collections.length === 0 ? (
              <p className="text-center text-slate-400 font-bold text-sm py-10">لا توجد تحصيلات في هذه الفترة</p>
            ) : (
              collections.map((row) => (
                <div key={row.id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between hover:border-emerald-200 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-1">{row.partyName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span className="bg-slate-200/70 px-2 py-0.5 rounded-md">{formatArabicDate(row.date)}</span>
                      <span>{row.description}</span>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                      + {formatArabicNumber(row.credit, 0)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payments Side */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col h-[600px] print:h-auto print:border-none print:shadow-none">
          <div className="p-4 border-b border-slate-100 bg-rose-50/50">
            <h3 className="font-bold text-rose-900 flex items-center gap-2">
              <ArrowUpFromLine className="w-5 h-5 text-rose-600" />
              تفاصيل المدفوعات للموردين
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {payments.length === 0 ? (
              <p className="text-center text-slate-400 font-bold text-sm py-10">لا توجد مدفوعات في هذه الفترة</p>
            ) : (
              payments.map((row) => (
                <div key={row.id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between hover:border-rose-200 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800 text-sm mb-1">{row.partyName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span className="bg-slate-200/70 px-2 py-0.5 rounded-md">{formatArabicDate(row.date)}</span>
                      <span>{row.description}</span>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <span className="font-black text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                      - {formatArabicNumber(row.debit, 0)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
