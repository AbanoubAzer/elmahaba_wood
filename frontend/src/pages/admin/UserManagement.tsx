import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Key, UserPlus, Power, PowerOff, Edit3, Loader2 } from 'lucide-react';
import { backendApi } from '../../services/api';
import { formatArabicDate } from '../../utils/numberUtils';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'STOREKEEPER';
  active: boolean;
  createdAt: string;
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'password'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'ACCOUNTANT',
    active: true,
  });

  const loadUsers = async () => {
    try {
      const data = await backendApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError('فشل تحميل المستخدمين. قد لا تملك صلاحية الوصول.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAdd = () => {
    setModalMode('add');
    setFormData({ name: '', email: '', phone: '', password: '', role: 'ACCOUNTANT', active: true });
    setSelectedUser(null);
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setModalMode('edit');
    setFormData({ name: user.name, email: user.email, phone: user.phone, password: '', role: user.role, active: user.active ?? true });
    setSelectedUser(user);
    setShowModal(true);
  };

  const openPasswordReset = (user: User) => {
    setModalMode('password');
    setFormData({ ...formData, password: '' });
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'add') {
        await backendApi.createUser(formData);
      } else if (modalMode === 'edit' && selectedUser) {
        await backendApi.updateUser(selectedUser.id, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          active: formData.active,
        });
      } else if (modalMode === 'password' && selectedUser) {
        await backendApi.resetUserPassword(selectedUser.id, formData.password);
      }
      setShowModal(false);
      await loadUsers();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (user: User) => {
    if (!window.confirm(`هل أنت متأكد من ${user.active ? 'إيقاف' : 'تفعيل'} هذا الحساب؟`)) return;
    setSaving(true);
    try {
      await backendApi.setUserActive(user.id, !user.active);
      await loadUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center" dir="rtl"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-indigo-600" />
            إدارة المستخدمين والصلاحيات
          </h1>
          <p className="text-slate-500 text-sm mt-1">إضافة مستخدمين، تعيين أدوار، والتحكم في الوصول.</p>
        </div>
        <button
          onClick={openAdd}
          disabled={saving}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
        >
          <UserPlus className="w-5 h-5" /> إضافة مستخدم
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">المستخدم</th>
              <th className="px-6 py-4">الدور (الصلاحية)</th>
              <th className="px-6 py-4">الحالة</th>
              <th className="px-6 py-4">تاريخ الإنشاء</th>
              <th className="px-6 py-4 text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email} | {user.phone}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'ACCOUNTANT' ? 'bg-blue-100 text-blue-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {user.role === 'ADMIN' ? 'مدير نظام' : user.role === 'ACCOUNTANT' ? 'محاسب' : 'مسؤول مخزن'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`flex items-center gap-1.5 text-xs font-bold ${user.active ? 'text-emerald-600' : 'text-red-600'}`}>
                    <span className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {user.active ? 'نشط' : 'موقوف'}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-500">{formatArabicDate(user.createdAt)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEdit(user)}
                      disabled={saving}
                      title="تعديل البيانات"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openPasswordReset(user)}
                      disabled={saving}
                      title="إعادة تعيين كلمة المرور"
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition disabled:opacity-50"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(user)}
                      disabled={saving}
                      title={user.active ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                      className={`p-2 rounded-lg transition disabled:opacity-50 ${
                        user.active 
                          ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {user.active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">
                {modalMode === 'add' ? 'إضافة مستخدم جديد' : modalMode === 'edit' ? 'تعديل بيانات المستخدم' : 'إعادة تعيين كلمة المرور'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalMode !== 'password' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الاسم بالكامل</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  {modalMode === 'add' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني (للدخول)</label>
                      <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف</label>
                    <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الدور (الصلاحية)</label>
                    <select required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-indigo-900">
                      <option value="ACCOUNTANT">محاسب (Accountant)</option>
                      <option value="STOREKEEPER">مسؤول مخزن (Storekeeper)</option>
                      <option value="ADMIN">مدير نظام (Admin)</option>
                    </select>
                    
                    {/* Role Description Box */}
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                      {formData.role === 'ADMIN' && (
                        <p><strong className="text-purple-700">مدير النظام:</strong> له كافة الصلاحيات على النظام بما فيها إدارة المستخدمين، الحذف، التعديل على جميع الأرصدة والتقارير والنسخ الاحتياطي.</p>
                      )}
                      {formData.role === 'ACCOUNTANT' && (
                        <p><strong className="text-blue-700">المحاسب:</strong> يمكنه إنشاء فواتير البيع والشراء، تحصيل النقدية، إدارة الخزينة، إضافة وتسوية حسابات العملاء والموردين، والاطلاع على التقارير المالية. <br/><span className="text-rose-600 font-bold">ممنوع من:</span> حذف المنتجات، إدارة المستخدمين.</p>
                      )}
                      {formData.role === 'STOREKEEPER' && (
                        <p><strong className="text-emerald-700">مسؤول المخزن:</strong> يمكنه إضافة وتعديل المنتجات، متابعة الكميات وحركة المخزون، وتسجيل الموردين. <br/><span className="text-rose-600 font-bold">ممنوع من:</span> الخزينة، التقارير المالية، كشوف الحسابات، حذف المنتجات المربوطة.</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Active/Inactive Checkbox - always show */}
                  <div className="flex items-center gap-2 mt-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <input 
                      type="checkbox" 
                      id="activeCheckbox"
                      checked={formData.active} 
                      onChange={(e) => setFormData({...formData, active: e.target.checked})}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" 
                    />
                    <label htmlFor="activeCheckbox" className="text-sm font-bold text-slate-700 cursor-pointer">
                      تفعيل الحساب (Active)
                    </label>
                  </div>
                </>
              )}

              {(modalMode === 'add' || modalMode === 'password') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
                  <input type="password" required minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  حفظ البيانات
                </button>
                <button type="button" onClick={() => setShowModal(false)} disabled={saving} className="px-6 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition disabled:opacity-50">
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
