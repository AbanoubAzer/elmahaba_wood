import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Landmark } from 'lucide-react';
import { useCheckStore } from '../../store/checkStore';
import { formatArabicNumber, formatArabicDate } from '../../utils/numberUtils';
import toast from 'react-hot-toast';

export const Checks: React.FC = () => {
  const { checks, loadChecks, addCheck, updateCheckStatus, deleteCheck, isLoading } = useCheckStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RECEIVABLE' | 'PAYABLE'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    checkNumber: '',
    bankName: '',
    dueDate: '',
    amount: 0,
    type: 'RECEIVABLE' as 'RECEIVABLE' | 'PAYABLE',
    partyName: '',
    notes: '',
  });

  useEffect(() => {
    loadChecks();
  }, [loadChecks]);

  const filteredChecks = checks.filter((c) => {
    const matchesType = filterType === 'ALL' || c.type === filterType;
    const matchesSearch =
      c.checkNumber.includes(searchTerm) ||
      c.partyName.includes(searchTerm) ||
      c.bankName.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.checkNumber || !formData.bankName || !formData.dueDate || formData.amount <= 0 || !formData.partyName) {
      toast.error('يرجى تعبئة الحقول الأساسية وتأكيد المبلغ');
      return;
    }

    setIsSubmitting(true);
    try {
      await addCheck({
        ...formData,
        status: 'PENDING',
      });
      toast.success('تمت إضافة الشيك بنجاح');
      setShowModal(false);
      setFormData({
        checkNumber: '',
        bankName: '',
        dueDate: '',
        amount: 0,
        type: 'RECEIVABLE',
        partyName: '',
        notes: '',
      });
    } catch (error) {
      // toast is handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Landmark className="w-6 h-6 text-indigo-600" />
            <span>إدارة الشيكات (أوراق القبض والدفع)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">متابعة الشيكات المستحقة للعملاء والموردين وتواريخ استحقاقها.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة شيك جديد</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث برقم الشيك، العميل، أو البنك..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          {(['ALL', 'RECEIVABLE', 'PAYABLE'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filterType === type
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              {type === 'ALL' ? 'الكل' : type === 'RECEIVABLE' ? 'أوراق قبض (لنا)' : 'أوراق دفع (علينا)'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">رقم الشيك</th>
                <th className="px-4 py-3 whitespace-nowrap">العميل / المورد</th>
                <th className="px-4 py-3 whitespace-nowrap">البنك</th>
                <th className="px-4 py-3 whitespace-nowrap">النوع</th>
                <th className="px-4 py-3 whitespace-nowrap">تاريخ الاستحقاق</th>
                <th className="px-4 py-3 whitespace-nowrap">المبلغ</th>
                <th className="px-4 py-3 whitespace-nowrap">الحالة</th>
                <th className="px-4 py-3 whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">جاري التحميل...</td>
                </tr>
              ) : filteredChecks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-bold">لا توجد شيكات</td>
                </tr>
              ) : (
                filteredChecks.map((check) => {
                  const isDueSoon = check.status === 'PENDING' && check.dueDate.split('T')[0] <= todayStr;
                  return (
                    <tr key={check.id} className={`hover:bg-slate-50 transition-all ${isDueSoon ? 'bg-rose-50/50' : ''}`}>
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{check.checkNumber}</td>
                      <td className="px-4 py-3 font-bold">{check.partyName}</td>
                      <td className="px-4 py-3">{check.bankName}</td>
                      <td className="px-4 py-3 text-xs">
                        {check.type === 'RECEIVABLE' ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-bold">ورقة قبض</span>
                        ) : (
                          <span className="bg-rose-100 text-rose-800 px-2 py-1 rounded-md font-bold">ورقة دفع</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-3.5 h-3.5 ${isDueSoon ? 'text-rose-500' : 'text-slate-400'}`} />
                          <span className={`${isDueSoon ? 'text-rose-600 font-bold' : ''}`}>
                            {formatArabicDate(check.dueDate)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-black text-indigo-700">
                        {formatArabicNumber(check.amount)} <span className="text-[10px] text-slate-500">ج.م</span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={check.status}
                          onChange={(e) => updateCheckStatus(check.id, e.target.value as any)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border-none focus:ring-0 ${
                            check.status === 'CLEARED' ? 'bg-emerald-100 text-emerald-800' :
                            check.status === 'BOUNCED' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}
                        >
                          <option value="PENDING">معلق (لم يحصل)</option>
                          <option value="CLEARED">مُحصّل</option>
                          <option value="BOUNCED">مرفوض / مرتد</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (window.confirm('هل أنت متأكد من الحذف؟')) deleteCheck(check.id);
                          }}
                          className="text-rose-600 hover:text-rose-800 font-bold text-xs"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden" dir="rtl">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Landmark className="w-5 h-5" />
                <span>إضافة شيك جديد</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-indigo-200 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">النوع <span className="text-rose-500">*</span></label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-bold"
                  >
                    <option value="RECEIVABLE">ورقة قبض (عميل سيدفع لنا)</option>
                    <option value="PAYABLE">ورقة دفع (سندفع نحن للمورد)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الشيك <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.checkNumber}
                    onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">البنك المُصدِر <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الاستحقاق <span className="text-rose-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المبلغ (ج.م) <span className="text-rose-500">*</span></label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-bold text-indigo-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم العميل / المورد <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={formData.partyName}
                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">ملاحظات إضافية</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الشيك'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold text-sm transition-all"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
