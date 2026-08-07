import React, { useState } from 'react';
import {
  Warehouse,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react';
import { useWoodStore } from '../../store/woodStore';
import { formatArabicNumber, formatArabicDate } from '../../utils/numberUtils';

export const Inventory: React.FC = () => {
  const { products, movements } = useWoodStore();
  const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMovements = movements.filter((m) => {
    const matchesType = filterType === 'all' || m.type === filterType;
    const matchesSearch =
      m.productName.includes(searchTerm) ||
      m.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalIn = movements.filter((m) => m.type === 'in').reduce((acc, m) => acc + m.volumeM3, 0);
  const totalOut = movements.filter((m) => m.type === 'out').reduce((acc, m) => acc + m.volumeM3, 0);
  const totalStock = products.reduce((acc, p) => acc + p.volumeM3, 0);
  const totalStockValue = products.reduce((acc, p) => acc + p.volumeM3 * p.pricePerM3, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Warehouse className="w-6 h-6 text-[#f28913]" />
          <span>سجل حركة المخزن</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          عرض تلقائي لكل حركات الأخشاب الواردة والصادرة — مصدرها فواتير الشراء والبيع فقط.
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-start gap-3">
        <FileText className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-800">
          <span className="font-bold">كيف يتحدث المخزن؟</span>
          <span className="font-medium"> — كل ما تُصدر فاتورة شراء ✅ يُضاف الخشب للمخزن تلقائياً. كل ما تُصدر فاتورة بيع ✅ يُخصم من المخزن تلقائياً. لا يوجد إدخال يدوي لمنع تضاعف الأرقام.</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-500 font-bold">إجمالي الوارد</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-emerald-700">{totalIn.toFixed(2)} <span className="text-xs text-slate-400">m³</span></p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-500 font-bold">إجمالي الصادر</p>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-rose-700">{totalOut.toFixed(2)} <span className="text-xs text-slate-400">m³</span></p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-500 font-bold">رصيد المخزن الحالي</p>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#f28913] flex items-center justify-center font-black text-[10px]">
              m³
            </div>
          </div>
          <p className="text-lg font-black text-slate-900">{totalStock.toFixed(2)} <span className="text-xs text-slate-400">m³</span></p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-500 font-bold">قيمة المخزن الإجمالية</p>
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-purple-700">{formatArabicNumber(totalStockValue, 0)} <span className="text-xs text-slate-400">ج.م</span></p>
        </div>
      </div>

      {/* Products Stock Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-[#f28913]" />
          <h3 className="font-extrabold text-slate-900 text-sm">رصيد الأصناف الحالي</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="py-3 px-4 text-slate-600 font-bold">الكود</th>
                <th className="py-3 px-4 text-slate-600 font-bold">اسم الصنف</th>
                <th className="py-3 px-4 text-slate-600 font-bold">المواصفات</th>
                <th className="py-3 px-4 text-slate-600 font-bold text-center">الرصيد المتاح</th>
                <th className="py-3 px-4 text-slate-600 font-bold text-center">سعر m³</th>
                <th className="py-3 px-4 text-slate-600 font-bold text-center">قيمة الرصيد</th>
                <th className="py-3 px-4 text-slate-600 font-bold text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => {
                const isLow = p.volumeM3 <= p.minStockM3;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3 px-4 font-mono font-bold text-[#f28913]">{p.code}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-500">{p.specs}</td>
                    <td className="py-3 px-4 text-center font-mono font-black text-slate-900">{p.volumeM3.toFixed(4)} m³</td>
                    <td className="py-3 px-4 text-center font-medium">{formatArabicNumber(p.pricePerM3, 0)} ج.م</td>
                    <td className="py-3 px-4 text-center font-bold text-emerald-700">{formatArabicNumber(p.volumeM3 * p.pricePerM3, 0)} ج.م</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        isLow ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isLow ? '⚠ مخزون منخفض' : '✓ متاح'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movements Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الفاتورة أو اسم الخشب أو الكود..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#f28913]/30"
          />
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'in', 'out'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all ${
                filterType === t
                  ? t === 'all' ? 'bg-[#f28913] text-white'
                    : t === 'in' ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t === 'all' ? 'الكل' : t === 'in' ? '↓ وارد (شراء)' : '↑ صادر (بيع)'}
            </button>
          ))}
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <h3 className="font-extrabold text-slate-900 text-sm">سجل الحركات ({filteredMovements.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3.5 px-4 text-slate-600 font-bold">التاريخ</th>
                <th className="py-3.5 px-4 text-slate-600 font-bold">رقم الفاتورة</th>
                <th className="py-3.5 px-4 text-slate-600 font-bold">النوع</th>
                <th className="py-3.5 px-4 text-slate-600 font-bold">الكود</th>
                <th className="py-3.5 px-4 text-slate-600 font-bold">اسم الصنف</th>
                <th className="py-3.5 px-4 text-slate-600 font-bold text-center">الكمية m³</th>
                <th className="py-3.5 px-4 text-slate-600 font-bold text-center">سعر m³</th>
                <th className="py-3.5 px-4 text-slate-600 font-bold text-center">القيمة</th>
                <th className="py-3.5 px-4 text-slate-600 font-bold">بواسطة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                    لا توجد حركات مطابقة — أنشئ فاتورة شراء أو بيع لتظهر هنا
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition-all">
                    <td className="py-3.5 px-4 font-medium">{formatArabicDate(m.date)}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#f28913]">{m.invoiceNo}</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        m.type === 'in' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {m.type === 'in'
                          ? <><ArrowDownLeft className="w-3 h-3" /> وارد — شراء</>
                          : <><ArrowUpRight className="w-3 h-3" /> صادر — بيع</>
                        }
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">{m.productCode}</td>
                    <td className="py-3.5 px-4 font-bold">{m.productName}</td>
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-center">{m.volumeM3.toFixed(4)}</td>
                    <td className="py-3.5 px-4 text-center">{formatArabicNumber(m.pricePerM3, 0)} ج.م</td>
                    <td className="py-3.5 px-4 font-bold text-center text-emerald-700">{formatArabicNumber(m.totalValue, 0)} ج.م</td>
                    <td className="py-3.5 px-4 text-slate-500">{m.createdBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
