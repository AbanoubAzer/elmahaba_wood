import React, { useState } from 'react';
import { Users, Plus, Search, Phone, MapPin, FileText, Loader2 } from 'lucide-react';
import { useCustomerSupplierStore } from '../../store/customerSupplierStore';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export const Customers: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { customers, addCustomer, updateCustomer } = useCustomerSupplierStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    balance: 0,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.includes(searchTerm) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.address && c.address.includes(searchTerm))
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          notes: formData.notes,
        });
        toast.success('تم تعديل بيانات العميل بنجاح');
      } else {
        addCustomer(formData);
        toast.success('تمت إضافة العميل بنجاح');
      }
      setShowModal(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', address: '', notes: '', balance: 0 });
    } catch (err: any) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      notes: customer.notes || '',
      balance: customer.balance,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#f28913]" />
            <span>إدارة العملاء والورش</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            دليل العملاء، المديونيات، ومتابعة كشوف الحسابات الموحدة.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', address: '', notes: '', balance: 0 });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-[#f28913] hover:bg-[#d97a0e] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة عميل جديد</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم العميل، رقم الهاتف، أو العنوان..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#f28913]/30"
          />
        </div>
        <div className="text-xs font-bold text-slate-500">
          إجمالي العملاء: <span className="text-[#f28913]">{filteredCustomers.length}</span>
        </div>
      </div>

      {/* Customers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedCustomers.map((c) => (
          <div
            key={c.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-bold text-slate-900 text-sm leading-snug">{c.name}</h3>
                {currentUser?.role === 'admin' && (
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0 ${
                      c.balance > 0
                        ? 'bg-amber-100 text-amber-800'
                        : c.balance < 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.balance > 0 ? 'مدين (عليه)' : c.balance < 0 ? 'دائن (له)' : 'خالي من الديون'}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#f28913]" />
                  <span className="font-mono">{c.phone || 'غير مسجل'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#f28913] shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{c.address || 'العنوان غير مدون'}</span>
                </div>
              </div>

              {c.notes && (
                <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-4 line-clamp-2">
                  {c.notes}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                {currentUser?.role === 'admin' && (
                  <>
                    <p className="text-[10px] text-slate-400 font-medium">الرصيد الحالي</p>
                    <p className="font-black text-sm text-slate-900">
                      {Math.abs(c.balance).toLocaleString()}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">ج.م</span>
                    </p>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(c)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 transition-all"
                  title="تعديل بيانات العميل"
                >
                  <span>✏️</span>
                  <span>تعديل</span>
                </button>
                {currentUser?.role === 'admin' && (
                  <Link
                    to={`/customers/${c.id}/statement`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#f28913] text-xs font-bold rounded-xl border border-orange-200 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>كشف الحساب</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
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

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-base">{editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 font-bold text-lg hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {currentUser?.role === 'admin' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">الرصيد الافتتاحي (ج.م)</label>
                  <input
                    type="number"
                    disabled={!!editingCustomer}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f28913]/30 disabled:opacity-50"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: Number(e.target.value) })}
                  />
                  {editingCustomer && (
                    <p className="text-[10px] text-amber-600 mt-1">لا يمكن تعديل الرصيد الأساسي بعد الإنشاء. قم بعمل تسوية مالية.</p>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم العميل / اسم الورشة</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: المعلم مصطفى البقلي (ورشة الأمل)"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#f28913]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف / الواتساب</label>
                <input
                  type="text"
                  placeholder="01012345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-[#f28913]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان العميل / الورشة</label>
                <input
                  type="text"
                  placeholder="مثال: المنطقة الصناعية، التجمع الخامس"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#f28913]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات وشروط التعامل</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="يفضل دفع شيكات، مواعيد السداد..."
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
                  disabled={!formData.name || isSubmitting}
                  className="px-5 py-2 bg-[#f28913] hover:bg-[#d97a0e] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <span>{editingCustomer ? 'حفظ التعديلات' : 'حفظ العميل'}</span>
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
