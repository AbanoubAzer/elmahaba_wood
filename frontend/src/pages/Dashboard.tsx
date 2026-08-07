import React from 'react';
import {
  Trees,
  Wallet,
  Users,
  AlertTriangle,
  PlusCircle,
  FilePlus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  ChevronLeft,
  Bell,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useReminderStore } from '../store/reminderStore';
import { useWoodStore } from '../store/woodStore';
import { useTreasuryStore } from '../store/treasuryStore';
import { useCustomerSupplierStore } from '../store/customerSupplierStore';
import { useInstallmentStore } from '../store/installmentStore';
import { useInvoiceStore } from '../store/invoiceStore';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { products } = useWoodStore();
  const { treasuries } = useTreasuryStore();
  const { customers, suppliers } = useCustomerSupplierStore();
  const { installments } = useInstallmentStore();
  const { invoices } = useInvoiceStore();
  const { reminders, completeReminder, createReminder } = useReminderStore();

  const [showReminderModal, setShowReminderModal] = React.useState(false);
  const [newReminderTitle, setNewReminderTitle] = React.useState('');
  const [newReminderDesc, setNewReminderDesc] = React.useState('');
  const [newReminderDate, setNewReminderDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const totalStockM3 = products.reduce((acc, p) => acc + p.volumeM3, 0);
  const totalTreasuryBalance = treasuries.reduce((acc, t) => acc + t.balance, 0);
  const totalCustomerDebts = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);
  const totalSupplierDebts = suppliers.reduce((acc, s) => acc + (s.balance > 0 ? s.balance : 0), 0);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueInstallments = installments.filter((inst) => !inst.paid && inst.dueDate < todayStr);
  const lowStockProducts = products.filter((p) => p.volumeM3 <= p.minStockM3);

  const chartData = [
    { name: 'الأسبوع 1', مبيعات: 185000, مشتريات: 140000 },
    { name: 'الأسبوع 2', مبيعات: 240000, مشتريات: 190000 },
    { name: 'الأسبوع 3', مبيعات: 195000, مشتريات: 290000 },
    { name: 'الأسبوع 4', مبيعات: 310000, مشتريات: 120000 },
  ];

  const topProductsData = React.useMemo(() => {
    const productSales: Record<string, { name: string; volume: number }> = {};
    invoices.filter(i => String(i.type).toUpperCase() === 'SALE' && String(i.status).toUpperCase() !== 'CANCELLED').forEach(inv => {
      inv.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, volume: 0 };
        }
        productSales[item.productId].volume += Number(item.volumeM3);
      });
    });
    return Object.values(productSales)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [invoices]);

  const topCustomersData = React.useMemo(() => {
    return [...customers]
      .filter(c => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5)
      .map(c => ({ name: c.name, balance: c.balance }));
  }, [customers]);

  const PIE_COLORS = ['#f28913', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle || !newReminderDate) return;
    setIsSubmitting(true);
    try {
      await createReminder({
        title: newReminderTitle,
        description: newReminderDesc,
        dueDate: newReminderDate
      });
      setShowReminderModal(false);
      setNewReminderTitle('');
      setNewReminderDesc('');
    } catch (err) {
      alert('فشل إضافة التذكير');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#131b2f] via-slate-900 to-[#1e293b] text-white p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">لوحة التحكم الرئيسية</span>
          <h2 className="text-2xl font-extrabold mt-1">شركة المحبة لتجارة الأخشاب</h2>
          <p className="text-slate-300 text-sm mt-1">
            مرحباً بك! متابعة فورية لحجم المخزون بالـ m³، الخزائن، الفواتير، والالتزامات المالية.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/invoices/new?type=sale"
            className="flex items-center gap-2 bg-[#f28913] hover:bg-[#d97a0e] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/25 transition-all"
          >
            <FilePlus className="w-4 h-4" />
            <span>فاتورة مبيعات جديدة</span>
          </Link>
          {currentUser?.role !== 'accountant' && (
            <Link
              to="/inventory"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl font-bold text-xs border border-slate-700 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              <span>إضافة خشب وارد</span>
            </Link>
          )}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {currentUser?.role === 'admin' && lowStockProducts.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-rose-700 mb-3">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-lg font-black">تنبيه نواقص المخزون! ({lowStockProducts.length} أصناف)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-rose-100 flex justify-between items-center shadow-xs">
                <div>
                  <p className="font-bold text-slate-800 text-sm">{p.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{p.code}</p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-rose-500 font-bold">الرصيد: {p.volumeM3.toFixed(2)} m³</p>
                  <p className="text-[10px] text-slate-400">الحد الأدنى: {p.minStockM3} m³</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {currentUser?.role === 'admin' && (
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-1">إجمالي الخشب بالمخزن</p>
              <h3 className="text-2xl font-black text-slate-900">
                {totalStockM3.toFixed(4)}{' '}
                <span className="text-xs font-bold text-[#f28913]">m³</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">{products.length} أصناف أخشاب مسجلة</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#f28913] flex items-center justify-center border border-orange-200">
              <Trees className="w-6 h-6" />
            </div>
          </div>
        )}

        {currentUser?.role === 'admin' && (
          <>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">سيولة الخزائن الإجمالية</p>
            <h3 className="text-2xl font-black text-slate-900">
              {totalTreasuryBalance.toLocaleString()}{' '}
              <span className="text-xs font-bold text-emerald-600">ج.م</span>
            </h3>
            <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>موزعة على {treasuries.length} خزائن ووسائل دفع</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">مستحقاتنا لدى العملاء</p>
            <h3 className="text-2xl font-black text-amber-600">
              {totalCustomerDebts.toLocaleString()}{' '}
              <span className="text-xs font-bold text-amber-700">ج.م</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">{customers.length} عملاء مسجلين</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">مستحقات الموردين علينا</p>
            <h3 className="text-2xl font-black text-rose-600">
              {totalSupplierDebts.toLocaleString()}{' '}
              <span className="text-xs font-bold text-rose-700">ج.م</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">{suppliers.length} موردين رئيسيين</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>
          </>
        )}
      </div>

      {overdueInstallments.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-rose-900 text-sm">
                تنبيه هام: توجد ({overdueInstallments.length}) أقساط متأخرة تجاوزت تاريخ الاستحقاق!
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                يرجى مراجعة جدول الأقساط واتخاذ إجراء السداد المالي لتجنب أي غرامات أو تأخير.
              </p>
            </div>
          </div>
          <Link
            to="/installments"
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shrink-0"
          >
            عرض الأقساط المتأخرة
          </Link>
        </div>
      )}

      {/* Advanced Dashboard Charts */}
      {currentUser?.role === 'admin' && (
        <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-[400px] flex flex-col">
          <h3 className="font-bold text-slate-800 text-lg mb-6">أكثر 5 أصناف مبيعاً (m³)</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'transparent' }} />
                <Bar dataKey="volume" fill="#f28913" radius={[0, 4, 4, 0]} name="الكمية المباعة" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Customers Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs h-[400px] flex flex-col">
          <h3 className="font-bold text-slate-800 text-lg mb-6">أكبر 5 عملاء (مديونيات مستحقة)</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topCustomersData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="balance"
                  nameKey="name"
                >
                  {topCustomersData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `${value.toLocaleString()} ج.م`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle Section: Chart & Treasuries Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-slate-900 text-base">مقارنة المبيعات والمشتريات الشهرية</h3>
              <p className="text-xs text-slate-500">حركة التداول المالي خلال الأسابيع الأربعة الحالية</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#f28913] bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100">
              <Calendar className="w-3.5 h-3.5" />
              <span>فبراير 2026</span>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#131b2f', borderRadius: '12px', color: '#fff', border: 'none' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString()} ج.م`, '']}
                />
                <Legend wrapperStyle={{ paddingTop: '15px' }} />
                <Bar dataKey="مبيعات" fill="#f28913" radius={[6, 6, 0, 0]} />
                <Bar dataKey="مشتريات" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-base">أرصدة الخزائن والحسابات</h3>
              <Link to="/treasury" className="text-xs font-bold text-[#f28913] hover:underline flex items-center gap-1">
                <span>إدارة</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {treasuries.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between hover:bg-slate-100/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#f28913] flex items-center justify-center font-bold text-xs">
                      {t.type === 'cash' ? '💵' : t.type === 'instapay' ? '⚡' : '🏦'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{t.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{t.accountNumber || 'حساب رئيسي'}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-sm text-slate-900">
                    {t.balance.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">ج.م</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/treasury"
            className="w-full mt-4 py-2.5 text-center text-xs font-bold text-[#f28913] bg-orange-50 hover:bg-orange-100 rounded-xl transition-all border border-orange-200 block"
          >
            التحويل بين الخزائن وتسجيل السندات
          </Link>
        </div>
      </div>
        </>
      )}

      {/* Reminders Section */}
      {currentUser?.role === 'admin' && (
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              تذكيرات النظام (المهام والأقساط)
            </h3>
            <p className="text-xs text-slate-500">متابعة التنبيهات المخصصة ومواعيد الاستحقاق</p>
          </div>
          <button
            onClick={() => setShowReminderModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>إضافة تذكير</span>
          </button>
        </div>

        <div className="space-y-3">
          {reminders.filter(r => !r.isCompleted).length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">لا توجد تذكيرات نشطة حالياً.</div>
          ) : (
            reminders.filter(r => !r.isCompleted).map(reminder => {
              const isOverdue = new Date(reminder.dueDate) < new Date();
              return (
                <div key={reminder.id} className={`flex items-start justify-between p-4 rounded-xl border ${isOverdue ? 'bg-red-50/50 border-red-100' : 'bg-orange-50/50 border-orange-100'}`}>
                  <div className="flex gap-3">
                    <div className={`mt-0.5 p-2 rounded-lg ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${isOverdue ? 'text-red-900' : 'text-orange-900'}`}>
                        {reminder.title}
                        {isOverdue && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">متأخر</span>}
                      </h4>
                      {reminder.description && <p className="text-xs text-slate-600 mt-1">{reminder.description}</p>}
                      <p className="text-[11px] font-mono mt-1.5 text-slate-500">
                        الاستحقاق: {new Date(reminder.dueDate).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => completeReminder(reminder.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 px-2 py-1.5 rounded transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    تم الإنجاز
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
      )}

      {/* Bottom Section: Recent Invoices Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">آخر الفواتير المسجلة</h3>
            <p className="text-xs text-slate-500">فواتير المبيعات والتوريد المسجلة مؤخراً</p>
          </div>
          <Link to="/invoices" className="text-xs font-bold text-[#f28913] hover:underline flex items-center gap-1">
            <span>عرض كل الفواتير</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-4 font-bold">رقم الفاتورة</th>
                <th className="py-3 px-4 font-bold">التاريخ</th>
                <th className="py-3 px-4 font-bold">النوع</th>
                <th className="py-3 px-4 font-bold">العميل / المورد</th>
                <th className="py-3 px-4 font-bold">إجمالي الـ m³</th>
                <th className="py-3 px-4 font-bold">إجمالي المبلغ</th>
                <th className="py-3 px-4 font-bold">المدفوع</th>
                <th className="py-3 px-4 font-bold">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {invoices
                .filter(inv => currentUser?.role === 'admin' || inv.createdBy === currentUser?.name)
                .slice(0, 5).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-all font-medium">
                  <td className="py-3 px-4 font-mono font-bold text-[#f28913]">{inv.invoiceNo}</td>
                  <td className="py-3 px-4">{inv.date}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        String(inv.type).toUpperCase() === 'SALE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {String(inv.type).toUpperCase() === 'SALE' ? 'مبيعات' : 'توريد / شراء'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold">{inv.partyName}</td>
                  <td className="py-3 px-4 font-mono">{inv.totalVolumeM3.toFixed(4)} m³</td>
                  <td className="py-3 px-4 font-bold">{inv.totalAmount.toLocaleString()} ج.م</td>
                  <td className="py-3 px-4 text-emerald-700 font-bold">{inv.paidAmount.toLocaleString()} ج.م</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'partial'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.status === 'paid' ? 'مدفوع بالكامل' : inv.status === 'partial' ? 'دفع جزئي' : 'غير مدفوع'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" dir="rtl">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-slate-800">إضافة تذكير جديد</h2>
              <button onClick={() => setShowReminderModal(false)} className="text-slate-400 hover:text-rose-500 text-2xl leading-none">&times;</button>
            </div>
            
            <form onSubmit={handleCreateReminder} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان التذكير *</label>
                <input
                  type="text"
                  required
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-bold"
                  placeholder="مثال: سداد قسط المورد محمد"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">التفاصيل (اختياري)</label>
                <textarea
                  value={newReminderDesc}
                  onChange={(e) => setNewReminderDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 h-20 resize-none"
                  placeholder="أي تفاصيل إضافية..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">تاريخ الاستحقاق *</label>
                <input
                  type="date"
                  required
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ التذكير'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-6 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-200"
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
