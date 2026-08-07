import React, { useState } from 'react';
import { Bell, Search, Calendar, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { currentUser } = useAuthStore();
  const { notifications, markAsRead } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;
  const currentDate = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-xs print:hidden">
      {/* Quick Search */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث سريع عن عميل، مورد، كود خشب، أو فاتورة..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#f28913]/30 focus:border-[#f28913] transition-all"
          />
        </div>
      </div>

      {/* Date & User Info & Notification Trigger */}
      <div className="flex items-center gap-5">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-[#f28913]" />
          <span>{currentDate}</span>
        </div>

        {/* Notifications Dropdown */}
        {currentUser?.role === 'admin' && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition-all"
              title="الإشعارات والتنبيهات"
            >
              <Bell className="w-5 h-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

          {/* Notifications Modal Popup */}
          {showNotifications && (
            <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#f28913]" />
                  <h3 className="font-bold text-slate-800 text-sm">التنبيهات والإشعارات</h3>
                </div>
                <span className="text-xs text-slate-500 font-semibold">{unreadCount} غير مقروء</span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">لا توجد إشعارات حالياً</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        notif.read
                          ? 'bg-slate-50/60 border-slate-100 text-slate-600'
                          : 'bg-orange-50/50 border-orange-200/60 text-slate-800 font-medium'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {notif.type === 'warning' ? (
                          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 mb-0.5">{notif.title}</p>
                          <p className="text-slate-600 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{notif.date}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={() => {
                  setShowNotifications(false);
                  navigate('/notifications');
                }}
                className="w-full mt-3 py-2 text-center text-xs font-bold text-[#f28913] hover:bg-orange-50 rounded-xl transition-all"
              >
                عرض كل الإشعارات وإعدادات البريد
              </button>
            </div>
            )}
          </div>
        )}

        {/* User Role Badge */}
        <div className="flex items-center gap-2 border-r pr-4 border-slate-200">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#f28913] flex items-center justify-center font-bold text-sm border border-orange-200">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">{currentUser?.name}</p>
            <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-100 text-emerald-800">
              متصل الآن
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
