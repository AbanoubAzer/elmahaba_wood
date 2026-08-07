import React, { useState } from 'react';
import { Wallet, ArrowLeftRight, Plus, History } from 'lucide-react';
import { useTreasuryStore } from '../../store/treasuryStore';
import { useAuthStore } from '../../store/authStore';

export const TreasuryAccounts: React.FC = () => {
  const { treasuries, transactions, transferFunds, addTreasury } = useTreasuryStore();
  const { currentUser } = useAuthStore();

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showNewTreasuryModal, setShowNewTreasuryModal] = useState(false);

  const [fromTreasuryId, setFromTreasuryId] = useState(treasuries[0]?.id || '');
  const [toTreasuryId, setToTreasuryId] = useState(treasuries[1]?.id || '');
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [newTreasuryName, setNewTreasuryName] = useState('');
  const [newTreasuryType, setNewTreasuryType] = useState<any>('cash');
  const [newAccountNumber, setNewAccountNumber] = useState('');

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromTreasuryId === toTreasuryId) {
      setErrorMsg('لا يمكن التحويل لنفس الخزانة');
      return;
    }
    if (amount <= 0) return;

    const success = transferFunds(
      fromTreasuryId,
      toTreasuryId,
      amount,
      notes || 'تحويل بين الخزائن',
      currentUser?.name || 'محاسب عام'
    );

    if (!success) {
      setErrorMsg('الرصيد المتاح غير كافٍ لإجراء هذا التحويل');
      return;
    }

    setShowTransferModal(false);
    setAmount(0);
    setNotes('');
    setErrorMsg('');
  };

  const handleNewTreasurySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreasuryName) return;
    addTreasury({
      name: newTreasuryName,
      type: newTreasuryType,
      accountNumber: newAccountNumber,
    });
    setShowNewTreasuryModal(false);
    setNewTreasuryName('');
    setNewAccountNumber('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-[#f28913]" />
            <span>إدارة الخزائن وطرق الدفع</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            متابعة درج الكاش، حسابات انستا باي، البنوك، المحافظ الإلكترونية، والتحويل بين الخزائن.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center gap-2 bg-[#f28913] hover:bg-[#d97a0e] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/25 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>تحويل بين الخزائن</span>
          </button>
          <button
            onClick={() => setShowNewTreasuryModal(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خزانة / وسيلة دفع</span>
          </button>
        </div>
      </div>

      {/* Treasuries Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {treasuries.map((t) => (
          <div
            key={t.id}
            className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-[#f28913] flex items-center justify-center font-bold text-base">
                  {t.type === 'cash' ? '💵' : t.type === 'instapay' ? '⚡' : t.type === 'bank_transfer' ? '🏦' : '📱'}
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  {t.type === 'cash'
                    ? 'كاش رئيسي'
                    : t.type === 'instapay'
                    ? 'انستا باي'
                    : t.type === 'bank_transfer'
                    ? 'حساب بنكي'
                    : 'محفظة إلكترونية'}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm mb-1">{t.name}</h3>
              <p className="text-[11px] text-slate-400 font-mono mb-4">{t.accountNumber || 'حساب رئيسي للمحل'}</p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium block">الرصيد المتوفر الآن</span>
              <strong className="text-xl font-black text-slate-900">
                {t.balance.toLocaleString()} <span className="text-xs text-[#f28913]">ج.م</span>
              </strong>
            </div>
          </div>
        ))}
      </div>

      {/* Inter-Treasury Transfer Records */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <History className="w-5 h-5 text-[#f28913]" />
          <h3 className="font-bold text-slate-900 text-sm">سجل التحويلات المالية بين الخزائن</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-bold">التاريخ</th>
                <th className="py-3 px-4 font-bold">من خزانة</th>
                <th className="py-3 px-4 font-bold">إلى خزانة</th>
                <th className="py-3 px-4 font-bold">المبلغ المحول</th>
                <th className="py-3 px-4 font-bold">السبب / الملاحظات</th>
                <th className="py-3 px-4 font-bold">بواسطة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-400">
                    لا توجد عمليات تحويل مسجلة بعد
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-all font-medium">
                    <td className="py-3 px-4 font-mono">{tx.date}</td>
                    <td className="py-3 px-4 font-bold text-rose-600">{tx.fromTreasuryName}</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">{tx.toTreasuryName}</td>
                    <td className="py-3 px-4 font-extrabold text-slate-900">{tx.amount.toLocaleString()} ج.م</td>
                    <td className="py-3 px-4 text-slate-600">{tx.notes}</td>
                    <td className="py-3 px-4 text-slate-500">{tx.createdBy}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Funds Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">تحويل أموال بين الخزائن</h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 font-bold text-lg">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold mb-3">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">التحويل من خزانة (خصم)</label>
                <select
                  value={fromTreasuryId}
                  onChange={(e) => setFromTreasuryId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {treasuries.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (المتاح: {t.balance.toLocaleString()} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">التحويل إلى خزانة (إيداع)</label>
                <select
                  value={toTreasuryId}
                  onChange={(e) => setToTreasuryId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
                >
                  {treasuries.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (المتاح: {t.balance.toLocaleString()} ج.م)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المبلغ المراد تحويله (ج.م)</label>
                <input
                  type="number"
                  required
                  placeholder="مثال: 15000"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-bold text-[#f28913]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">سبب التحويل والملاحظات</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="إيداع نقدية في حساب انستا باي للتوريد..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#f28913] hover:bg-[#d97a0e] text-white rounded-xl font-bold shadow-lg shadow-orange-500/20"
                >
                  تأكيد التحويل الآن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Treasury Modal */}
      {showNewTreasuryModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">إضافة خزانة / وسيلة دفع جديدة</h3>
              <button onClick={() => setShowNewTreasuryModal(false)} className="text-slate-400 font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={handleNewTreasurySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الخزانة / الحساب</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محفظة اتصالات كاش الفرعية"
                  value={newTreasuryName}
                  onChange={(e) => setNewTreasuryName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع وسيلة الدفع</label>
                <select
                  value={newTreasuryType}
                  onChange={(e) => setNewTreasuryType(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="cash">نقدي (درج كاش)</option>
                  <option value="instapay">تطبيق انستا باي (InstaPay)</option>
                  <option value="bank_transfer">حساب بنكي رئيسي</option>
                  <option value="vodafone_cash">محفظة إلكترونية (فودافون/غيرها)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الحساب / رقم المحفظة</label>
                <input
                  type="text"
                  placeholder="مثال: 010xxxxxxxx أو رقم IBAN"
                  value={newAccountNumber}
                  onChange={(e) => setNewAccountNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewTreasuryModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold"
                >
                  حفظ الخزانة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
