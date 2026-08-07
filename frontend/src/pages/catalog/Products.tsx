import React, { useState } from 'react';
import { Trees, Plus, Search, AlertCircle, Edit, Trash2, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { useWoodStore } from '../../store/woodStore';
import { useAuthStore } from '../../store/authStore';
import type { WoodProduct } from '../../types';
import { formatArabicNumber } from '../../utils/numberUtils';
import { toast } from 'react-hot-toast';

export const Products: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct } = useWoodStore();
  const { currentUser } = useAuthStore();
  const canEdit = currentUser?.role === 'admin' || currentUser?.role === 'storekeeper' || currentUser?.role === 'accountant';

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [fullTitleInput, setFullTitleInput] = useState('');
  const [volumeM3, setVolumeM3] = useState<number>(0);
  const [pricePerM3, setPricePerM3] = useState<number>(0);
  const [minStockM3, setMinStockM3] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products.filter(
    (p) =>
      p.name.includes(searchTerm) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.specs.includes(searchTerm) ||
      (p.notes && p.notes.includes(searchTerm))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullTitleInput.trim()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const parts = fullTitleInput.split('|').map((s) => s.trim());
      let code = '';
      let name = '';
      let specs = '';

      if (parts.length >= 3) {
        code = parts[0];
        name = parts[1];
        specs = parts[2];
      } else if (parts.length === 2) {
        code = parts[0];
        name = parts[1];
        specs = parts[1];
      } else {
        const words = fullTitleInput.trim().split(' ');
        code = words[0] || 'WOOD-' + Math.floor(Math.random() * 1000);
        name = fullTitleInput.trim();
        specs = fullTitleInput.trim();
      }

      const payload = {
        code,
        name,
        specs,
        volumeM3,
        pricePerM3,
        minStockM3,
        notes: notes || specs,
      };

      if (editingId) {
        updateProduct(editingId, payload);
      } else {
        addProduct(payload);
      }
      setIsSubmitting(false);
      setShowModal(false);
      resetForm();
    }, 500);
  };

  const handleEdit = (p: WoodProduct) => {
    setEditingId(p.id);
    setFullTitleInput(`${p.code} | ${p.name} | ${p.specs}`);
    setVolumeM3(p.volumeM3);
    setPricePerM3(p.pricePerM3);
    setMinStockM3(p.minStockM3);
    setNotes(p.notes || '');
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFullTitleInput('');
    setVolumeM3(0);
    setPricePerM3(0);
    setMinStockM3(5);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Trees className="w-6 h-6 text-[#f28913]" />
            <span>دليل المنتجات والأخشاب</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            إدارة أصناف الخشب والقياسات بالأمتار المكعبة (m³) وسعر المتر ورصيد المخزون.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 bg-[#f28913] hover:bg-[#d97a0e] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صنف خشب جديد</span>
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث بكود الخشب، اسم الخشب، أو الملاحظات..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#f28913]/30"
          />
        </div>
        <div className="text-xs font-bold text-slate-500">
          إجمالي الأصناف: <span className="text-[#f28913] font-mono">{formatArabicNumber(filteredProducts.length, 0)}</span>
        </div>
      </div>

      {/* Products Table with Harmonized Color Palette */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-100/70 text-slate-700 border-b border-slate-200">
                <th className="py-3.5 px-4 font-extrabold text-slate-900">
                  كود الخشب / اسم المنتج / الملاحظات والتفاصيل
                </th>
                {currentUser?.role === 'admin' && (
                  <>
                    <th className="py-3.5 px-4 font-bold">الرصيد بالمخزن (m³)</th>
                    <th className="py-3.5 px-4 font-bold">سعر المتر المكعب (m³)</th>
                    <th className="py-3.5 px-4 font-bold">إجمالي قيمة الصنف</th>
                    <th className="py-3.5 px-4 font-bold">الحالة بالمخزن</th>
                  </>
                )}
                {canEdit && <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredProducts.map((p) => {
                const isLowStock = p.volumeM3 <= p.minStockM3;
                const totalVal = p.volumeM3 * p.pricePerM3;

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                    {/* Harmonized Notes Badge */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {/* <span className="font-mono text-[#f28913] bg-orange-50 px-2.5 py-0.5 rounded-xl border border-orange-200 font-extrabold text-xs">
                          {p.code}
                        </span> */}
                        <span className="font-black text-slate-900 text-sm">{p.name}</span>
                      </div>

                      {/* Soft Harmonized Badge for Notes */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200 mt-0.5">
                        <FileText className="w-3.5 h-3.5 text-[#f28913] shrink-0" />
                        <span className="text-slate-500 font-medium">الملاحظات:</span>
                        <span className="text-slate-800 font-semibold">{p.notes || p.specs || 'درجة أولى ممتازة'}</span>
                      </div>
                    </td>

                    {currentUser?.role === 'admin' && (
                      <>
                        <td className="py-3.5 px-4 font-bold text-slate-900 bg-orange-50/30">
                          {formatArabicNumber(p.volumeM3, 4)} <span className="text-[10px] text-[#f28913]">m³</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {formatArabicNumber(p.pricePerM3, 0)} <span className="text-[10px] text-slate-500">ج.م</span>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                          {formatArabicNumber(totalVal, 0)} <span className="text-[10px] text-slate-500">ج.م</span>
                        </td>
                        <td className="py-3.5 px-4">
                          {isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <AlertCircle className="w-3 h-3" />
                              <span>مخزون منخفض</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>متوفر بالمخزن</span>
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    {canEdit && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="تعديل"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {currentUser?.role === 'admin' && (
                            <button
                              onClick={async () => {
                                if (confirm(`هل أنت تأكد من حذف الصنف "${p.name}"؟`)) {
                                  try {
                                    await deleteProduct(p.id);
                                    toast.success('تم حذف الصنف بنجاح');
                                  } catch (err: any) {
                                    toast.error(err.message || 'حدث خطأ أثناء الحذف');
                                  }
                                }
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingId ? 'تعديل بيانات الخشب' : 'إضافة صنف خشب جديد'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-extrabold text-slate-800 mb-1">
                  بيان صنف الخشب (الكود / اسم المنتج / الملاحظات)
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: MTSA-SH 100/19 | خشب سويد فنلندي | 100 × 19 مم"
                  value={fullTitleInput}
                  onChange={(e) => setFullTitleInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#f28913]/30 font-bold text-slate-900"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 أكتب كود الخشب واسمه وملاحظاته في حقل واحد مبسط.
                </p>
              </div>

              {currentUser?.role === 'admin' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      الكمية بالأمتار المكعبة (m³) <span className="text-[#f28913]">(4 أرقام)</span>
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      disabled={!!editingId}
                      placeholder="8.7951"
                      value={volumeM3 === 0 ? 0 : (volumeM3 || '')}
                      onChange={(e) => setVolumeM3(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#f28913]/30 font-bold text-slate-800 disabled:opacity-50"
                    />
                    {editingId && (
                      <p className="text-[10px] text-amber-600 mt-1 font-bold">لا يمكن تعديل الكمية يدوياً. قم بعمل فاتورة.</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">سعر المتر المكعب (ج.م)</label>
                    <input
                      type="number"
                      required
                      placeholder="14500"
                      value={pricePerM3 === 0 ? 0 : (pricePerM3 || '')}
                      onChange={(e) => setPricePerM3(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#f28913]/30 font-bold text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">الملاحظات والتفاصيل</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات الصنف، بلد الاستيراد، درجة الخشب..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#f28913]/30"
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
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 bg-[#f28913] hover:bg-[#d97a0e] text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>{editingId ? 'حفظ التعديلات' : 'إضافة الصنف'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
