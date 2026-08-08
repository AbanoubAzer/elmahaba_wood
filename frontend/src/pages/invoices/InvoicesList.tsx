import React, { useState } from 'react';
import { FileText, Plus, Search, Eye, Printer, Wallet, Calculator } from 'lucide-react';
import { useInvoiceStore } from '../../store/invoiceStore';
import { Link } from 'react-router-dom';
import type { Invoice } from '../../types';
import { formatArabicNumber, formatArabicDate, toArabicDigits } from '../../utils/numberUtils';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';

export const InvoicesList: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { invoices, cancelInvoice } = useInvoiceStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'purchase'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredInvoices = invoices.filter((inv) => {
    if (currentUser?.role !== 'admin' && inv.createdBy !== currentUser?.name) return false;
    const matchesType = filterType === 'all' || inv.type === filterType;
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.partyName.includes(searchTerm) ||
      (inv.notes && inv.notes.includes(searchTerm));
    return matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when search or filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'instapay':
        return '⚡ انستا باي (InstaPay)';
      case 'bank_transfer':
        return '🏦 تحويل بنكي';
      case 'vodafone_cash':
        return '📱 محفظة إلكترونية';
      case 'check':
        return '📄 شيك بنكي';
      case 'cash':
      default:
        return '💵 نقداً (كاش)';
    }
  };

  const handleCancel = async (invoiceId: string) => {
    if (!window.confirm('هل أنت متأكد من إلغاء هذه الفاتورة؟ سيتم رد الكميات للمخزن وإلغاء المديونيات المتعلقة بها ولن يمكن التراجع عن هذا الإجراء.')) return;

    setIsCancelling(true);
    try {
      const createdBy = 'النظام';
      await cancelInvoice(invoiceId, createdBy);
      toast.success('تم إلغاء الفاتورة بنجاح وتحديث الحسابات والمخازن');
      setSelectedInvoice(null);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الإلغاء');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Content (Hidden during print if a modal is open) */}
      <div className={`space-y-6 ${selectedInvoice ? 'print:hidden' : ''}`}>
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#f28913]" />
              <span>سجل الفواتير (مبيعات وتوريد)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              عرض كافة الفواتير، تفاصيل المدفوع والمتبقي، طرق الدفع، ومعاينة الفاتورة والطباعة.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/invoices/new?type=sale"
              className="flex items-center gap-2 bg-[#f28913] hover:bg-[#d97a0e] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>فاتورة مبيعات جديدة</span>
            </Link>
            <Link
              to="/invoices/new?type=purchase"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-600/25 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>فاتورة توريد خشب</span>
            </Link>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث برقم الفاتورة، العميل، المورد، أو الاتفاق المكتوب..."
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#f28913]/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all ${filterType === 'all' ? 'bg-[#f28913] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              الكل ({formatArabicNumber(invoices.length, 0)})
            </button>
            <button
              onClick={() => setFilterType('sale')}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all ${filterType === 'sale' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              فواتير المبيعات
            </button>
            <button
              onClick={() => setFilterType('purchase')}
              className={`px-3 py-1.5 text-xs rounded-xl font-bold transition-all ${filterType === 'purchase' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              فواتير الشراء والتوريد
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none print:w-full">
          <style>
            {`
              @media print {
                @page { size: landscape; margin: 10mm; }
                body { -webkit-print-color-adjust: exact; }
              }
            `}
          </style>
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="py-3.5 px-4 font-bold">رقم الفاتورة</th>
                  <th className="py-3.5 px-4 font-bold">التاريخ</th>
                  <th className="py-3.5 px-4 font-bold">النوع</th>
                  <th className="py-3.5 px-4 font-bold">الطرف (عميل/مورد)</th>
                  <th className="py-3.5 px-4 font-bold">إجمالي الـ m³</th>
                  <th className="py-3.5 px-4 font-bold">إجمالي الفاتورة</th>
                  <th className="py-3.5 px-4 font-bold">المدفوع حالياً</th>
                  <th className="py-3.5 px-4 font-bold">الباقي (المتبقي آجل)</th>
                  <th className="py-3.5 px-4 font-bold">وسيلة وملاحظات السداد</th>
                  <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className={`hover:bg-slate-50/80 transition-all font-medium ${inv.status === 'cancelled' ? 'opacity-60 bg-red-50/30' : ''}`}>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#f28913]">
                      <div className="flex items-center gap-2">
                        {toArabicDigits(inv.invoiceNo)}
                        {inv.status === 'cancelled' && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[9px]">ملغاة</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{formatArabicDate(inv.date)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${inv.type === 'sale'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                          }`}
                      >
                        {inv.type === 'sale' ? 'مبيعات' : 'شراء وتوريد'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{inv.partyName}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {formatArabicNumber(inv.totalVolumeM3, 4)} m³
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {formatArabicNumber(inv.totalAmount, 0)} ج.م
                    </td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">
                      {formatArabicNumber(inv.paidAmount, 0)} ج.م
                    </td>
                    <td className="py-3.5 px-4 text-rose-600 font-bold">
                      {formatArabicNumber(inv.remainingAmount, 0)} ج.م
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-700 block text-[11px]">
                        {getPaymentMethodLabel(inv.paymentMethod)}
                      </span>
                      {inv.notes && (
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs">{inv.notes}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 text-slate-700 hover:text-[#f28913] hover:bg-orange-50 rounded-lg transition-all"
                        title="معاينة تفاصيل الفاتورة والطباعة"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedInvoices.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-500 font-bold">
                      لا توجد فواتير مطابقة للبحث أو الفلتر
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-xl">
            <div className="text-xs text-slate-600">
              عرض صفحة <span className="font-bold">{currentPage}</span> من <span className="font-bold">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detailed Invoice View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#f28913] text-white flex items-center justify-center font-bold">
                  م
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">فاتورة رقم {toArabicDigits(selectedInvoice.invoiceNo)}</h3>
                  <p className="text-xs text-slate-500">التاريخ: {formatArabicDate(selectedInvoice.date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                {selectedInvoice.status !== 'cancelled' && (
                  <button
                    onClick={() => handleCancel(selectedInvoice.id)}
                    disabled={isCancelling}
                    className="flex items-center gap-1.5 bg-rose-50 text-rose-600 text-xs font-bold px-3.5 py-1.5 rounded-xl hover:bg-rose-100 border border-rose-200 transition-all disabled:opacity-50"
                  >
                    <span>{isCancelling ? 'جاري الإلغاء...' : 'إلغاء الفاتورة'}</span>
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl hover:bg-slate-800"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة</span>
                </button>
                <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg px-2">
                  ✕
                </button>
              </div>
            </div>

            {/* Party & General Info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs grid grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 font-medium block">الطرف الرئيسي (العميل/المورد):</span>
                <strong className="text-slate-900 font-bold text-sm">{selectedInvoice.partyName}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">نوع اتفاق سداد الفاتورة:</span>
                <strong className="text-slate-900 font-bold">
                  {selectedInvoice.paymentType === 'cash'
                    ? 'نقدي بالكامل (كاش)'
                    : selectedInvoice.paymentType === 'credit'
                      ? 'آجل بالكامل (كشف حساب)'
                      : 'دفع جزئي (دفعة مسددة والباقي آجل)'}
                </strong>
              </div>
            </div>

            {/* Dedicated Payment Breakdown Card */}
            <div className="bg-gradient-to-r from-[#131b2f] via-slate-900 to-[#1e293b] text-white p-5 rounded-2xl shadow-lg space-y-3">
              <h4 className="font-extrabold text-white text-xs flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Calculator className="w-4 h-4 text-[#f28913]" />
                <span>تفاصيل السداد والمالية للفاتورة</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">إجمالي الفاتورة:</span>
                  <strong className="text-sm font-black text-white">{formatArabicNumber(selectedInvoice.totalAmount, 0)} ج.م</strong>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">المبلغ المدفوع (الدفعة):</span>
                  <strong className="text-sm font-black text-emerald-400">{formatArabicNumber(selectedInvoice.paidAmount, 0)} ج.م</strong>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block">المتبقي (الباقي آجل):</span>
                  <strong className="text-sm font-black text-amber-400">{formatArabicNumber(selectedInvoice.remainingAmount, 0)} ج.م</strong>
                </div>

                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                  <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                    <Wallet className="w-3 h-3 text-[#f28913]" />
                    وسيلة السداد:
                  </span>
                  <strong className="text-xs font-bold text-slate-200 mt-0.5 block">
                    {getPaymentMethodLabel(selectedInvoice.paymentMethod)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <h4 className="font-extrabold text-slate-900 text-xs mb-2">بنود الأخشاب المباعة/الموردة بالفاتورة:</h4>
              <table className="w-full text-right text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700">
                    <th className="py-2 px-3 font-bold">كود الخشب / الصنف والقياسات</th>
                    <th className="py-2 px-3 font-bold">الكمية (m³)</th>
                    <th className="py-2 px-3 font-bold">سعر المتر المكعب</th>
                    <th className="py-2 px-3 font-bold">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{item.productName}</td>
                      <td className="py-2.5 px-3 font-mono">{formatArabicNumber(item.volumeM3, 4)} m³</td>
                      <td className="py-2.5 px-3 font-mono">{formatArabicNumber(item.pricePerM3, 0)} ج.م</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                        {formatArabicNumber(item.total, 0)} ج.م
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Verbal Agreement Notes */}
            {selectedInvoice.notes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                <span className="font-bold text-amber-900 block mb-1">ملاحظات الفاتورة والاتفاقات الشفهية المكتوبة:</span>
                <p className="text-amber-800 leading-relaxed">{selectedInvoice.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-xs">
              <div>
                <span className="text-slate-500 font-medium">محرر الفاتورة:</span>
                <strong className="text-slate-800 mr-1">{selectedInvoice.createdBy}</strong>
              </div>
              <div className="text-left font-black text-base text-[#f28913]">
                إجمالي قيمة الفاتورة: {formatArabicNumber(selectedInvoice.totalAmount, 0)} ج.م
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
