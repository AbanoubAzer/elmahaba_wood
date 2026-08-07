import React, { useState } from 'react';
import { CalendarDays, Plus, CheckSquare, Square, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { useInstallmentStore } from '../../store/installmentStore';

export const InstallmentPlans: React.FC = () => {
  const { installments, addInstallment, togglePaid, deleteInstallment } = useInstallmentStore();
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    partyName: '',
    partyType: 'supplier' as 'supplier' | 'person' | 'general',
    amount: 0,
    dueDate: '',
    notes: '',
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyName || !formData.dueDate) return;

    addInstallment(formData);
    setShowModal(false);
    setFormData({
      partyName: '',
      partyType: 'supplier',
      amount: 0,
      dueDate: '',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-[#f28913]" />
            <span>جدول الأقساط والتنبيهات العمومية</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            جدول متابعة الأقساط المستحقة والتنبيهات العمومية مع تظليل المتأخر باللون الأحمر.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#f28913] hover:bg-[#d97a0e] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة قسط / تنبيه عام</span>
        </button>
      </div>

      {/* Installments Table */}
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
                <th className="py-3.5 px-4 font-bold text-center">السداد (علامة صح)</th>
                <th className="py-3.5 px-4 font-bold">المستحق له / عنوان التنبيه</th>
                <th className="py-3.5 px-4 font-bold">النوع</th>
                <th className="py-3.5 px-4 font-bold">تاريخ الاستحقاق</th>
                <th className="py-3.5 px-4 font-bold">القيمة (إن وجدت)</th>
                <th className="py-3.5 px-4 font-bold">الحالة والتنبيه</th>
                <th className="py-3.5 px-4 font-bold">ملاحظات</th>
                <th className="py-3.5 px-4 font-bold text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {installments.map((inst) => {
                const isOverdue = !inst.paid && inst.dueDate < todayStr;

                return (
                  <tr
                    key={inst.id}
                    className={`transition-all ${
                      inst.paid
                        ? 'bg-slate-50/50 text-slate-400 opacity-80'
                        : isOverdue
                        ? 'bg-rose-50 border-r-4 border-r-rose-600 font-bold text-rose-950'
                        : 'hover:bg-slate-50 font-medium'
                    }`}
                  >
                    {/* Checkbox for Payment */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => togglePaid(inst.id)}
                        className={`p-1 rounded-lg transition-transform hover:scale-110 ${
                          inst.paid ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-700'
                        }`}
                        title={inst.paid ? 'تم السداد - اضغط للإلغاء' : 'اضغط لتأكيد السداد'}
                      >
                        {inst.paid ? (
                          <CheckSquare className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <Square className="w-5 h-5" />
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900">{inst.partyName}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${inst.partyType === 'general' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {inst.partyType === 'supplier' ? 'مورد أخشاب' : inst.partyType === 'person' ? 'التزام شخصي' : 'تنبيه عام'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">{inst.dueDate}</td>
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                      {inst.amount > 0 ? `${inst.amount.toLocaleString()} ج.م` : '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      {inst.paid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>مسدد بتاريخ {inst.paidDate}</span>
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white shadow-xs animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>متأخر! تجاوز الاستحقاق</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <span>قادم في موعده</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{inst.notes || '-'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت تأكد من حذف هذا القسط؟`)) {
                            deleteInstallment(inst.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:bg-rose-100/50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Installment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">إضافة قسط أو تنبيه عام</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم أو عنوان التنبيه</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة دمياط الدولية أو دفع فاتورة الكهرباء"
                  value={formData.partyName}
                  onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ (اختياري)</label>
                  <input
                    type="number"
                    placeholder="35000"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">النوع</label>
                <select
                  value={formData.partyType}
                  onChange={(e) => setFormData({ ...formData, partyType: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="supplier">مورد أخشاب (قسط مستحق)</option>
                  <option value="person">شخص / إيجار / التزام مالي</option>
                  <option value="general">تنبيه عام (بدون مبلغ)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات والتفاصيل</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="تفاصيل شحنة الخشب، رقم الشيك..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
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
                  className="px-5 py-2 bg-[#f28913] hover:bg-[#d97a0e] text-white rounded-xl font-bold shadow-lg shadow-orange-500/20"
                >
                  حفظ القسط
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
