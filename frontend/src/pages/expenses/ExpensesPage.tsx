import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Printer, Plus, Trash2, Filter } from 'lucide-react';
import { useExpenseStore, EXPENSE_CATEGORIES } from '../../store/expenseStore';
import { useTreasuryStore } from '../../store/treasuryStore';
import { useAuthStore } from '../../store/authStore';
import { formatArabicDate, toArabicDigits } from '../../utils/numberUtils';
import toast from 'react-hot-toast';

export const ExpensesPage: React.FC = () => {
  const { expenses, addExpense, deleteExpense, loadFromBackend } = useExpenseStore();
  const { treasuries } = useTreasuryStore();
  const { currentUser } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: EXPENSE_CATEGORIES[0],
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    treasuryId: '',
    notes: '',
  });

  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTreasury, setFilterTreasury] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    loadFromBackend();
  }, [loadFromBackend]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.amount <= 0 || !formData.date || !formData.treasuryId) return;

    const selectedTreasury = treasuries.find(t => t.id === formData.treasuryId);
    if (selectedTreasury && formData.amount > selectedTreasury.balance) {
      toast.error('عذراً، رصيد الخزينة المحددة لا يكفي لهذا المصروف.');
      return;
    }

    await addExpense({
      ...formData,
      createdBy: 'مدير النظام',
    });
    
    setShowModal(false);
    setFormData({
      title: '',
      category: EXPENSE_CATEGORIES[0],
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      treasuryId: '',
      notes: '',
    });
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      let matches = true;
      if (filterCategory && exp.category !== filterCategory) matches = false;
      if (filterTreasury && exp.treasuryId !== filterTreasury) matches = false;
      if (startDate && exp.date < startDate) matches = false;
      if (endDate && exp.date > endDate) matches = false;
      return matches;
    });
  }, [expenses, filterCategory, filterTreasury, startDate, endDate]);

  const totalFiltered = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-rose-600" />
            <span>إدارة المصروفات</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            تسجيل المصروفات ومتابعتها مع الخصم التلقائي من الخزينة، وإصدار التقارير المفلترة.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-rose-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مصروف جديد</span>
          </button>
        </div>
      </div>

      {/* Filters (Hidden in print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold">
          <Filter className="w-4 h-4" />
          <span>خيارات الفلترة المتقدمة للتقارير</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-bold">
          <div>
            <label className="block text-slate-600 mb-1">من تاريخ</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">إلى تاريخ</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-slate-600 mb-1">التصنيف</label>
            <select 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="">كل التصنيفات</option>
              {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-slate-600 mb-1">الخزينة المنصرف منها</label>
            <select 
              value={filterTreasury} 
              onChange={e => setFilterTreasury(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
            >
              <option value="">كل الخزن</option>
              {treasuries.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content & Print Area */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden print:border-none print:shadow-none print:w-full" dir="rtl">
        <style>
          {`
            @media print {
              @page { size: portrait; margin: 10mm; }
              body { -webkit-print-color-adjust: exact; }
            }
          `}
        </style>
        
        {/* Print Header */}
        <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-bold mb-2">تقرير المصروفات</h1>
          <p className="text-sm font-bold text-slate-700">
            {startDate ? `من: ${formatArabicDate(startDate)}` : ''} 
            {endDate ? ` إلى: ${formatArabicDate(endDate)}` : ''}
          </p>
          <p className="text-sm font-bold text-slate-700">
            {filterCategory ? `التصنيف: ${filterCategory}` : 'كل التصنيفات'} | 
            {filterTreasury ? ` الخزينة: ${treasuries.find(t => t.id === filterTreasury)?.name || 'الكل'}` : ' كل الخزن'}
          </p>
        </div>

        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-right text-xs print:text-[11px] border-collapse print:border print:border-slate-400">
            <thead>
              <tr className="bg-slate-50 text-slate-600 print:bg-slate-200 print:border print:border-slate-400">
                <th className="py-3 px-4 font-bold print:border print:border-slate-400">التاريخ</th>
                <th className="py-3 px-4 font-bold print:border print:border-slate-400">بيان المصروف</th>
                <th className="py-3 px-4 font-bold print:border print:border-slate-400">التصنيف</th>
                <th className="py-3 px-4 font-bold print:border print:border-slate-400">المبلغ</th>
                <th className="py-3 px-4 font-bold print:border print:border-slate-400">الخزينة</th>
                <th className="py-3 px-4 font-bold print:border print:border-slate-400">ملاحظات</th>
                <th className="py-3 px-4 font-bold text-center print:hidden">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50 font-medium print:border print:border-slate-400">
                  <td className="py-3 px-4 print:border print:border-slate-400">{formatArabicDate(exp.date)}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 print:border print:border-slate-400">{exp.title}</td>
                  <td className="py-3 px-4 print:border print:border-slate-400">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 print:bg-transparent print:p-0">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-extrabold text-rose-600 print:text-black print:border print:border-slate-400">
                    {toArabicDigits(exp.amount)} ج.م
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-bold print:border print:border-slate-400">
                    {treasuries.find(t => t.id === exp.treasuryId)?.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 print:border print:border-slate-400">{exp.notes || '-'}</td>
                  <td className="py-3 px-4 text-center print:hidden">
                    <button
                      onClick={() => {
                        if (confirm('هل أنت متأكد من حذف هذا المصروف؟ (ملاحظة: هذا لن يضيف المبلغ العكسي للخزينة تلقائياً)')) {
                          deleteExpense(exp.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-100/50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-slate-400 font-bold">لا توجد مصروفات تطابق خيارات البحث</td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-100/80 font-black print:bg-slate-200">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-left print:border print:border-slate-400">الإجمالي:</td>
                <td className="py-3 px-4 text-rose-700 print:text-black print:border print:border-slate-400">{toArabicDigits(totalFiltered)} ج.م</td>
                <td colSpan={3} className="print:border print:border-slate-400 print:hidden"></td>
                <td colSpan={2} className="hidden print:table-cell print:border print:border-slate-400"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-slate-900 text-base mb-4 border-b border-slate-100 pb-4">تسجيل مصروف جديد</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">البيان (إلى من يُصرف أو الوصف)</label>
                <input
                  type="text" required placeholder="مثال: فاتورة كهرباء المخزن"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ (ج.م)</label>
                  <input
                    type="number" required min="1"
                    value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تاريخ المصروف</label>
                  <input
                    type="date" required
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التصنيف</label>
                  <select
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">يخصم من (الخزينة)</label>
                  <select
                    required
                    value={formData.treasuryId} onChange={e => setFormData({...formData, treasuryId: e.target.value})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="" disabled>اختر الخزينة...</option>
                    {treasuries.map(t => <option key={t.id} value={t.id}>{t.name} {currentUser?.role === 'admin' ? `(${t.balance} ج.م)` : ''}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات (اختياري)</label>
                <textarea
                  rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-500/20">حفظ المصروف وخصم الخزينة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
