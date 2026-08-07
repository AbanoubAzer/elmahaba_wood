import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  TreePine,
  Users,
  Shield,
  Box,
  Warehouse,
  Receipt,
  Truck,
  Wallet,
  BookOpen,
  Route,
  CalendarDays,
  BarChart3,
  ChevronDown,
  Bell,
  LogOut,
  Database,
  Landmark,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCheckStore } from '../../store/checkStore';
import { GlobalSearch } from '../search/GlobalSearch';

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  roles?: string[];
  subItems?: { label: string; path: string }[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'الرئيسية',
    items: [
      { icon: Home, label: 'لوحة التحكم', path: '/', roles: ['admin', 'accountant', 'storekeeper'] },
    ],
  },
  {
    title: 'إدارة المخزون والأخشاب',
    items: [
      { icon: Box, label: 'الأخشاب والمنتجات (m³)', path: '/products', roles: ['admin', 'accountant', 'storekeeper'] },
      { icon: Warehouse, label: 'المخزن والوارد والصادر', path: '/inventory', roles: ['admin', 'storekeeper'] },
    ],
  },
  {
    title: 'العملاء والموردين',
    items: [
      { icon: Users, label: 'دليل العملاء والورش', path: '/customers', roles: ['admin', 'accountant'] },
      { icon: Truck, label: 'الموردين والشركات', path: '/suppliers', roles: ['admin', 'accountant', 'storekeeper'] },
    ],
  },
  {
    title: 'الفواتير والمالية',
    items: [
      { icon: Receipt, label: 'فواتير البيع والتوريد', path: '/invoices', roles: ['admin', 'accountant'] },
      { icon: Landmark, label: 'الشيكات (أوراق قبض ودفع)', path: '/checks', roles: ['admin'] },
      { icon: Wallet, label: 'الخزائن وطرق الدفع', path: '/treasury', roles: ['admin'] },
      { icon: FileText, label: 'إدارة المصروفات', path: '/expenses', roles: ['admin', 'accountant'] },
      { icon: BookOpen, label: 'كشوف الحسابات الموحدة', path: '/ledger', roles: ['admin'] },
      { icon: CalendarDays, label: 'جدول الأقساط والالتزامات', path: '/installments', roles: ['admin'] },
    ],
  },
  {
    title: 'التقارير وخطوط السير',
    items: [
      { icon: Route, label: 'خط سير التحصيل (Drag & Drop)', path: '/collection-route', roles: ['admin'] },
      { icon: BarChart3, label: 'أرباح وخسائر / مالية', path: '/reports', roles: ['admin'] },
      { icon: Wallet, label: 'حركة الأموال والتدفق (Cash Flow)', path: '/reports/cash-flow', roles: ['admin'] },
    ],
  },
  {
    title: 'الإدارة والأمان',
    items: [
      { icon: Users, label: 'إدارة المستخدمين', path: '/users', roles: ['admin'] },
      { icon: Database, label: 'النسخ الاحتياطي (Backup)', path: '/backup', roles: ['admin'] },
      { icon: Shield, label: 'سجل النشاطات (Audit Logs)', path: '/audit-logs', roles: ['admin'] },
      { icon: Bell, label: 'التنبيهات والبريد (Gmail)', path: '/notifications', roles: ['admin'] },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { checks } = useCheckStore();
  const role = currentUser?.role?.toLowerCase() || 'admin';
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingChecksCount = checks.filter(c => c.status === 'PENDING' && c.dueDate.split('T')[0] <= todayStr).length;

  return (
    <aside className="w-64 bg-[#131b2f] text-slate-300 h-screen flex flex-col shadow-2xl z-30 sticky top-0 overflow-hidden print:hidden select-none border-l border-slate-800">
      {/* Brand Logo Header */}
      <div className="p-5 flex flex-col items-center border-b border-slate-800/80 shrink-0">
        <div className="bg-[#f28913] p-3 rounded-2xl shadow-lg shadow-orange-500/20 mb-2">
          <TreePine className="text-white w-7 h-7" />
        </div>
        <h1 className="text-white text-xl font-black tracking-wide">شركة المحبة</h1>
        <span className="text-[#f28913] text-[11px] font-extrabold tracking-widest mt-0.5 uppercase">
          لتجارة الأخشاب الممتازة
        </span>
      </div>


      {/* Global Search */}
      <div className="px-3 pb-2 shrink-0">
        <GlobalSearch />
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
        {menuGroups.map((group, groupIdx) => {
          const validItems = group.items.filter((i) => !i.roles || i.roles.includes(role));
          if (validItems.length === 0) return null;

          return (
            <div key={groupIdx}>
              <h3 className="px-3 text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {validItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx}>
                      {item.subItems ? (
                        <>
                          <button
                            onClick={() => setExpandedItem(expandedItem === item.path ? null : item.path)}
                            className="flex items-center justify-between w-full px-3 py-2 rounded-xl transition-all duration-200 hover:bg-slate-800 hover:text-white text-slate-300 text-xs font-bold"
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 text-[#f28913]" />
                              <span>{item.label}</span>
                            </div>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                expandedItem === item.path ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {expandedItem === item.path && (
                            <div className="mt-1 mr-3 pr-3 border-r border-slate-700/50 space-y-1">
                              {item.subItems.map((sub, subIdx) => (
                                <NavLink
                                  key={subIdx}
                                  to={sub.path}
                                  className={({ isActive }) =>
                                    `block px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                      isActive
                                        ? 'bg-[#f28913] text-white font-bold shadow-md'
                                        : 'hover:bg-slate-800 hover:text-white text-slate-400'
                                    }`
                                  }
                                >
                                  {sub.label}
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (() => {
                        const hasBadge = item.path === '/checks' && pendingChecksCount > 0;
                        return (
                          <NavLink
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) =>
                              `flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                                isActive
                                  ? 'bg-[#f28913] text-white font-bold shadow-lg shadow-orange-500/20'
                                  : 'hover:bg-slate-800/80 hover:text-white text-slate-300'
                              }`
                            }
                          >
                            <div className="flex items-center gap-2.5">
                              <Icon className="w-4 h-4 text-[#f28913]" />
                              <span>{item.label}</span>
                            </div>
                            {hasBadge && (
                              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                                {pendingChecksCount}
                              </span>
                            )}
                          </NavLink>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-[#f28913] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {currentUser?.name.charAt(0)}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-200 truncate">{currentUser?.name}</p>
            <p className="text-[10px] text-amber-400 font-medium">
              {role === 'admin' ? 'مدير النظام' : role === 'accountant' ? 'محاسب عام' : 'مسؤول المخزن'}
            </p>
          </div>
        </div>
        <button
          onClick={() => useAuthStore.getState().logout()}
          title="تسجيل الخروج"
          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
