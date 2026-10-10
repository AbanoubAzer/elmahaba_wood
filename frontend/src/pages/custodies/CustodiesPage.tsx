import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  Trash2,
  Edit,
  Phone,
  AlertCircle,
  X,
  FileText,
} from 'lucide-react';
import { useCustodyStore } from '../../store/custodyStore';
import type { Custody } from '../../types';
import { formatArabicNumber, formatArabicDate, toArabicDigits, getEgyptToday } from '../../utils/numberUtils';
import { Pagination } from '../../components/ui/Pagination';
import toast from 'react-hot-toast';

export const CustodiesPage: React.FC = () => {
  const { custodies, loadFromBackend, addCustody, updateCustody, toggleDelivered, deleteCustody } =
    useCustodyStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'DELIVERED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptItem, setReceiptItem] = useState<Custody | null>(null);

  const [formData, setFormData] = useState({
    personName: '',
    phone: '',
    location: '',
    amount: 0,
    expectedReturnDate: '',
    delivered: false,
    notes: '',
  });

  useEffect(() => {
    loadFromBackend();
  }, [loadFromBackend]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const filteredCustodies = custodies.filter((c) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'DELIVERED' && c.delivered) ||
      (statusFilter === 'PENDING' && !c.delivered);

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      c.personName.toLowerCase().includes(term) ||
      (c.location && c.location.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term)) ||
      (c.notes && c.notes.toLowerCase().includes(term));

    return matchesStatus && matchesSearch;
  });

  const paginatedCustodies = filteredCustodies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Financial Stats
  const totalAmount = custodies.reduce((sum, c) => sum + (c.amount || 0), 0);
  const pendingAmount = custodies
    .filter((c) => !c.delivered)
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const deliveredAmount = custodies
    .filter((c) => c.delivered)
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  const pendingCount = custodies.filter((c) => !c.delivered).length;
  const deliveredCount = custodies.filter((c) => c.delivered).length;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      personName: '',
      phone: '',
      location: '',
      amount: 0,
      expectedReturnDate: '',
      delivered: false,
      notes: '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (c: Custody) => {
    setEditingId(c.id);
    setFormData({
      personName: c.personName,
      phone: c.phone || '',
      location: c.location || '',
      amount: c.amount,
      expectedReturnDate: c.expectedReturnDate || '',
      delivered: c.delivered,
      notes: c.notes || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.personName.trim()) {
      toast.error('يرجى كتابة اسم الشخص صاحب الأمانة');
      return;
    }
    if (formData.amount <= 0) {
      toast.error('يرجى تحديد مبلغ الأمانة أكبر من صفر');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateCustody(editingId, {
          personName: formData.personName.trim(),
          phone: formData.phone.trim() || undefined,
          location: formData.location.trim() || undefined,
          amount: formData.amount,
          expectedReturnDate: formData.expectedReturnDate || undefined,
          delivered: formData.delivered,
          notes: formData.notes.trim() || undefined,
        });
        toast.success('تم تعديل بيانات الأمانة بنجاح');
      } else {
        await addCustody({
          personName: formData.personName.trim(),
          phone: formData.phone.trim() || undefined,
          location: formData.location.trim() || undefined,
          amount: formData.amount,
          expectedReturnDate: formData.expectedReturnDate || undefined,
          delivered: formData.delivered,
          notes: formData.notes.trim() || undefined,
        });
        toast.success('تمت إضافة الأمانة بنجاح');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (c: Custody) => {
    try {
      await toggleDelivered(c.id);
      if (!c.delivered) {
        toast.success(`تم تأكيد تسليم/استرداد أمانة ${c.personName}`);
      } else {
        toast('تم إعادة حالة الأمانة إلى قيد الانتظار');
      }
    } catch {
      toast.error('فشل تحديث حالة الأمانة');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف أمانة "${name}"؟`)) {
      try {
        await deleteCustody(id);
        toast.success('تم حذف القيد بنجاح');
      } catch {
        toast.error('فشل حذف القيد');
      }
    }
  };

  const todayStr = getEgyptToday();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <span>إدارة الأمانات والعُهد</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            متابعة المبالغ والأمانات المسلمة للأشخاص (المكان، موعد العودة المتوقع، وحالة التسليم).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الكشف</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ إضافة أمانة جديدة</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 block mb-1">إجمالي الأمانات المسجلة</span>
            <span className="text-2xl font-black text-slate-900">{formatArabicNumber(totalAmount, 0)} ج.م</span>
            <span className="text-[11px] text-slate-400 block mt-1">عدد: {toArabicDigits(custodies.length)} أمانة</span>
          </div>
          <div className="p-3 bg-slate-100 rounded-2xl text-slate-700">
            <ShieldCheck className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-800 block mb-1">أمانات مع الأشخاص (لم تُسلم)</span>
            <span className="text-2xl font-black text-amber-900">{formatArabicNumber(pendingAmount, 0)} ج.م</span>
            <span className="text-[11px] text-amber-700 block mt-1 font-bold">عدد: {toArabicDigits(pendingCount)} طرف الأشخاص</span>
          </div>
          <div className="p-3 bg-amber-200/60 rounded-2xl text-amber-800">
            <Clock className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-800 block mb-1">أمانات تم تسليمها واستردادها</span>
            <span className="text-2xl font-black text-emerald-900">{formatArabicNumber(deliveredAmount, 0)} ج.م</span>
            <span className="text-[11px] text-emerald-700 block mt-1 font-bold">عدد: {toArabicDigits(deliveredCount)} تم التسليم</span>
          </div>
          <div className="p-3 bg-emerald-200/60 rounded-2xl text-emerald-800">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم الشخص، المكان (مثل أسوان)، الملاحظات..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto text-xs font-bold">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition-all ${
              statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({toArabicDigits(custodies.length)})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition-all ${
              statusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⏳ مع الأشخاص ({toArabicDigits(pendingCount)})
          </button>
          <button
            onClick={() => setStatusFilter('DELIVERED')}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition-all ${
              statusFilter === 'DELIVERED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✅ تم التسليم ({toArabicDigits(deliveredCount)})
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        {/* Printable Header */}
        <div className="hidden print:block p-6 text-center border-b-2 border-black mb-4">
          <h1 className="text-2xl font-black mb-1">كشف حركة الأمانات والعُهد المالية</h1>
          <p className="text-xs text-slate-600">شركة المحبة لتجارة الأخشاب - تاريخ الطباعة: {formatArabicDate(todayStr)}</p>
          <div className="flex justify-center gap-6 mt-3 text-xs font-bold">
            <span>إجمالي الأمانات: {formatArabicNumber(totalAmount, 0)} ج.م</span>
            <span>طرف الأشخاص: {formatArabicNumber(pendingAmount, 0)} ج.م</span>
            <span>المسدد/المسترد: {formatArabicNumber(deliveredAmount, 0)} ج.م</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
              <tr>
                <th className="py-3.5 px-4 text-center w-12">#</th>
                <th className="py-3.5 px-4">اسم الشخص والمستلم</th>
                <th className="py-3.5 px-4">المكان / الوجهة</th>
                <th className="py-3.5 px-4 text-center">مبلغ الأمانة</th>
                <th className="py-3.5 px-4 text-center">ميعاد العودة المتوقع</th>
                <th className="py-3.5 px-4 text-center">حالة التسليم</th>
                <th className="py-3.5 px-4">ملاحظات</th>
                <th className="py-3.5 px-4 text-center print:hidden w-36">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredCustodies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm">لا توجد أمانات مسجلة تطابق البحث</p>
                  </td>
                </tr>
              ) : (
                paginatedCustodies.map((c, idx) => {
                  const globalIdx = (currentPage - 1) * itemsPerPage + idx;
                  const isOverdue = !c.delivered && c.expectedReturnDate && c.expectedReturnDate < todayStr;
                  const isDueToday = !c.delivered && c.expectedReturnDate && c.expectedReturnDate === todayStr;

                  return (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-50/80 transition-all font-medium ${
                        c.delivered ? 'bg-emerald-50/20' : isOverdue ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                        {toArabicDigits(globalIdx + 1)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">{c.personName}</div>
                        {c.phone && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5" dir="ltr">
                            <span>{toArabicDigits(c.phone)}</span>
                            <Phone className="w-3 h-3 text-slate-400" />
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {c.location ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-bold text-xs">
                            <MapPin className="w-3.5 h-3.5 text-blue-600" />
                            <span>{c.location}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="text-sm font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 inline-block font-mono">
                          {formatArabicNumber(c.amount, 0)} ج.م
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {c.expectedReturnDate ? (
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-slate-800">{formatArabicDate(c.expectedReturnDate)}</span>
                            {isOverdue && (
                              <span className="text-[10px] text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                                <AlertCircle className="w-3 h-3" />
                                <span>فات موعد العودة</span>
                              </span>
                            )}
                            {isDueToday && (
                              <span className="text-[10px] text-amber-600 font-bold">اليوم موعد العودة</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggle(c)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs ${
                            c.delivered
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                          }`}
                          title="اضغط لتغيير حالة التسليم"
                        >
                          {c.delivered ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>تم التسليم</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3.5 h-3.5" />
                              <span>مع الشخص</span>
                            </>
                          )}
                        </button>
                        {c.delivered && c.deliveredDate && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            بتاريخ: {formatArabicDate(c.deliveredDate)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs text-slate-600">
                        {c.notes ? <span className="line-clamp-2">{c.notes}</span> : <span className="text-slate-400">-</span>}
                      </td>

                      <td className="py-3.5 px-4 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setReceiptItem(c)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="طباعة إيصال أمانة"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="تعديل الأمانة"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id, c.personName)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف الأمانة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredCustodies.length > 0 && (
              <tfoot className="bg-slate-100 font-black border-t-2 border-slate-300 text-slate-900">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-center">
                    الإجمالي العام للأمانات المعروضة ({toArabicDigits(filteredCustodies.length)} أمانة)
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-sm text-amber-800">
                    {formatArabicNumber(
                      filteredCustodies.reduce((s, it) => s + (it.amount || 0), 0),
                      0
                    )}{' '}
                    ج.م
                  </td>
                  <td colSpan={4} className="py-3 px-4 text-center text-slate-500 font-bold">
                    طرف الأشخاص:{' '}
                    {formatArabicNumber(
                      filteredCustodies.filter((it) => !it.delivered).reduce((s, it) => s + (it.amount || 0), 0),
                      0
                    )}{' '}
                    ج.م | تم التسليم:{' '}
                    {formatArabicNumber(
                      filteredCustodies.filter((it) => it.delivered).reduce((s, it) => s + (it.amount || 0), 0),
                      0
                    )}{' '}
                    ج.م
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 print:hidden">
          <Pagination
            currentPage={currentPage}
            totalItems={filteredCustodies.length}
            pageSize={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Modal: Add / Edit Custody */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150 space-y-4" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>{editingId ? 'تعديل بيانات الأمانة' : 'إضافة أمانة / عهدة جديدة'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
              <div>
                <label className="block text-slate-700 mb-1">
                  اسم الشخص / المستلم للأمانة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  placeholder="مثال: أحمد السواق، محمد حسنين..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">المكان / الوجهة المتواجد بها</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="مثال: في أسوان، مخزن الجيزة..."
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="010..."
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1">
                    مبلغ الأمانة (ج.م) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="مثال: 50000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-amber-700 focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1">تاريخ / موعد العودة المتوقع</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      value={formData.expectedReturnDate}
                      onChange={(e) => setFormData({ ...formData, expectedReturnDate: e.target.value })}
                      className="w-full pl-3 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1">ملاحظات وتفاصيل الأمانة</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="مثال: عهدة شراء بضاعة، هيرجع يوم الأحد لتسليم الفلوس..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/30 text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="block text-slate-800 text-xs font-bold">حالة التسليم الآن</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {formData.delivered ? 'تم تسليم واسترداد المبلغ بالكامل' : 'المبلغ ما زال مع الشخص (لم يُسلم بعد)'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.delivered}
                    onChange={(e) => setFormData({ ...formData, delivered: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'تسجيل الأمانة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Receipt Voucher Print */}
      {receiptItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150 space-y-4" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>إيصال استلام أمانة</span>
              </h3>
              <button onClick={() => setReceiptItem(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            {/* Printable Receipt Layout */}
            <div className="p-6 border-2 border-slate-800 rounded-2xl bg-amber-50/20 space-y-4 text-xs font-bold text-slate-900">
              <div className="text-center border-b-2 border-slate-800 pb-3">
                <h2 className="text-lg font-black">شركة المحبة لتجارة الأخشاب</h2>
                <h3 className="text-sm font-bold text-slate-600 mt-0.5">سند أمانة / عهدة مالية</h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  التاريخ: {formatArabicDate(receiptItem.createdAt)}
                </span>
              </div>

              <div className="space-y-2.5 leading-relaxed text-sm">
                <p>
                  اسم المستلم: <span className="text-indigo-900 font-black">{receiptItem.personName}</span>
                </p>
                {receiptItem.phone && (
                  <p>
                    الهاتف: <span className="font-mono">{toArabicDigits(receiptItem.phone)}</span>
                  </p>
                )}
                {receiptItem.location && (
                  <p>
                    المكان / الوجهة: <span className="text-blue-900 font-black">{receiptItem.location}</span>
                  </p>
                )}
                <div className="bg-amber-100/70 p-2.5 rounded-xl border border-amber-300">
                  <p className="text-base font-black text-amber-950">
                    مبلغ الأمانة: {formatArabicNumber(receiptItem.amount, 0)} ج.م
                  </p>
                </div>
                {receiptItem.expectedReturnDate && (
                  <p>
                    موعد العودة المتوقع:{' '}
                    <span className="text-slate-800 font-black">{formatArabicDate(receiptItem.expectedReturnDate)}</span>
                  </p>
                )}
                <p>
                  حالة التسليم:{' '}
                  <span className={receiptItem.delivered ? 'text-emerald-700 font-black' : 'text-amber-800 font-black'}>
                    {receiptItem.delivered ? 'تم التسليم والاسترداد' : 'قيد الانتظار (مع الشخص)'}
                  </span>
                </p>
                {receiptItem.notes && (
                  <p className="text-xs text-slate-600 font-medium">
                    ملاحظات: {receiptItem.notes}
                  </p>
                )}
              </div>

              <div className="pt-6 border-t border-slate-300 flex justify-between px-4 text-center text-xs">
                <div>
                  <p className="border-b border-slate-400 w-24 pb-1 mb-1">توقيع المستلم</p>
                </div>
                <div>
                  <p className="border-b border-slate-400 w-24 pb-1 mb-1">توقيع الإدارة</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => setReceiptItem(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
