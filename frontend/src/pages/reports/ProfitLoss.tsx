import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Download, RefreshCw } from 'lucide-react';
import { backendApi } from '../../services/api';
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { formatArabicNumber } from '../../utils/numberUtils';
import { Skeleton } from '../../components/ui/Skeleton';

interface PnlData {
  period: { from: string | null; to: string | null };
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalExpenses: number;
    grossProfit: number;
    profitMarginPct: number;
    totalCollected: number;
    totalPaid: number;
    outstandingReceivables: number;
    outstandingPayables: number;
    invoiceCount: { sales: number; purchases: number };
  };
  byProduct: Array<{
    productId: string;
    productCode: string;
    productName: string;
    soldVolumeM3: number;
    soldRevenue: number;
    purchasedVolumeM3: number;
    purchasedCost: number;
    profit: number;
  }>;
}

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}> = ({ label, value, icon, color, sub }) => (
  <div className={`rounded-2xl p-5 border ${color} space-y-3`}>
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium opacity-75">{label}</span>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold">{formatArabicNumber(value)} ج.م</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  </div>
);

export const ProfitLoss: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [from, setFrom] = useState(`${currentYear}-01-01`);
  const [to, setTo] = useState(`${currentYear}-12-31`);
  const [data, setData] = useState<PnlData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await backendApi.getPnl(from, to);
      setData(res);
    } catch (err: any) {
      setError('فشل تحميل التقرير — تأكد من اتصال الباك إند');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleExcelExport = () => {
    if (!data) return;
    const rows = data.byProduct.map((p) => ({
      'كود الصنف': p.productCode,
      'اسم الصنف': p.productName,
      'حجم المبيعات م³': p.soldVolumeM3.toFixed(4),
      'إيرادات المبيعات': p.soldRevenue,
      'حجم المشتريات م³': p.purchasedVolumeM3.toFixed(4),
      'تكلفة المشتريات': p.purchasedCost,
      'الربح الصافي': p.profit,
    }));
    exportToExcel(rows, `تقرير الأرباح والخسائر ${from} - ${to}`, 'P&L');
  };

  const handlePdfExport = () => {
    if (!data) return;
    exportToPdf(
      [
        { header: 'الصنف', dataKey: 'productName' },
        { header: 'مبيعات م³', dataKey: 'soldVolumeM3' },
        { header: 'الإيرادات', dataKey: 'soldRevenue' },
        { header: 'مشتريات م³', dataKey: 'purchasedVolumeM3' },
        { header: 'التكلفة', dataKey: 'purchasedCost' },
        { header: 'الربح', dataKey: 'profit' },
      ],
      data.byProduct.map((p) => ({
        ...p,
        soldVolumeM3: p.soldVolumeM3.toFixed(4),
        soldRevenue: p.soldRevenue.toLocaleString(),
        purchasedVolumeM3: p.purchasedVolumeM3.toFixed(4),
        purchasedCost: p.purchasedCost.toLocaleString(),
        profit: p.profit.toLocaleString(),
      })),
      `تقرير الأرباح والخسائر`,
      `الفترة: ${from} إلى ${to}`
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            تقرير الأرباح والخسائر
          </h1>
          <p className="text-slate-500 text-sm mt-1">تحليل مالي شامل للمبيعات والمشتريات</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          <span className="text-slate-400 text-sm">إلى</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300" />
          <button onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm hover:bg-slate-700 transition">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          {data && (
            <>
              <button onClick={handleExcelExport}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 transition">
                <Download className="w-4 h-4" /> Excel
              </button>
              <button onClick={handlePdfExport}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 transition">
                <Download className="w-4 h-4" /> PDF
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center">
          ⚠️ {error}
        </div>
      )}

      {isLoading && !data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      )}

      {data && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="إجمالي المبيعات"
              value={data.summary.totalRevenue}
              icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
              color="bg-blue-50 border-blue-100 text-blue-900"
              sub={`${data.summary.invoiceCount.sales} فاتورة`}
            />
            <StatCard
              label="إجمالي المشتريات"
              value={data.summary.totalCost}
              icon={<TrendingDown className="w-5 h-5 text-orange-600" />}
              color="bg-orange-50 border-orange-100 text-orange-900"
              sub={`${data.summary.invoiceCount.purchases} فاتورة`}
            />
            <StatCard
              label="إجمالي المصروفات"
              value={data.summary.totalExpenses || 0}
              icon={<TrendingDown className="w-5 h-5 text-red-600" />}
              color="bg-red-50 border-red-100 text-red-900"
            />
            <StatCard
              label="الربح الإجمالي"
              value={data.summary.grossProfit}
              icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
              color={`${data.summary.grossProfit >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-red-50 border-red-100 text-red-900'}`}
              sub={`هامش الربح: ${data.summary.profitMarginPct.toFixed(1)}%`}
            />
            <StatCard
              label="مستحقات غير محصّلة"
              value={data.summary.outstandingReceivables}
              icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
              color="bg-purple-50 border-purple-100 text-purple-900"
              sub={`مدفوع: ${formatArabicNumber(data.summary.totalCollected)} ج.م`}
            />
          </div>

          {/* Second row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">المحصّل من العملاء</p>
              <p className="text-xl font-bold text-slate-800">{formatArabicNumber(data.summary.totalCollected)} ج.م</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">المدفوع للموردين</p>
              <p className="text-xl font-bold text-slate-800">{formatArabicNumber(data.summary.totalPaid)} ج.م</p>
            </div>
          </div>

          {/* By Product Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden h-[500px] flex flex-col print:h-auto print:border-none print:shadow-none print:w-full">
            <style>
              {`
                @media print {
                  @page { size: landscape; margin: 10mm; }
                  body { -webkit-print-color-adjust: exact; }
                }
              `}
            </style>
            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
              <h3 className="font-bold text-indigo-900">تفاصيل الإيرادات والمبيعات</h3>
              <span className="font-black text-indigo-700">{data.summary.totalRevenue.toLocaleString()} ج.م</span>
            </div>
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-right">الصنف</th>
                    <th className="px-4 py-3 text-center">مبيعات م³</th>
                    <th className="px-4 py-3 text-center">إيرادات</th>
                    <th className="px-4 py-3 text-center">مشتريات م³</th>
                    <th className="px-4 py-3 text-center">تكلفة</th>
                    <th className="px-4 py-3 text-center">الربح</th>
                    <th className="px-4 py-3 text-center">هامش %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byProduct.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        لا توجد بيانات في هذه الفترة
                      </td>
                    </tr>
                  ) : data.byProduct.map((p) => {
                    const margin = p.soldRevenue > 0 ? (p.profit / p.soldRevenue) * 100 : 0;
                    return (
                      <tr key={p.productId} className="border-t border-slate-50 hover:bg-slate-50 transition">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{p.productName}</div>
                          <div className="text-xs text-slate-400">{p.productCode}</div>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">{p.soldVolumeM3.toFixed(4)}</td>
                        <td className="px-4 py-3 text-center font-medium text-blue-700">{p.soldRevenue.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center text-slate-600">{p.purchasedVolumeM3.toFixed(4)}</td>
                        <td className="px-4 py-3 text-center font-medium text-orange-700">{p.purchasedCost.toLocaleString()}</td>
                        <td className={`px-4 py-3 text-center font-bold ${p.profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {p.profit.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            margin >= 10 ? 'bg-emerald-100 text-emerald-700' :
                            margin >= 0 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfitLoss;
