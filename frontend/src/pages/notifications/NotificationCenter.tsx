import React, { useState } from 'react';
import { Bell, Mail, CheckCircle2, Save, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore';
import { backendApi } from '../../services/api';

export const NotificationCenter: React.FC = () => {
  const { notifications, smtpConfig, updateSmtpConfig, markAsRead } = useNotificationStore();

  const [smtpState, setSmtpState] = useState(smtpConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSmtpConfig(smtpState);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-[#f28913]" />
          <span>مركز الإشعارات ونظام التنبيهات المجاني</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          متابعة التنبيهات وإرسال إشعارات البريد الإلكتروني (Gmail SMTP 100% مجاناً) عند استحقاق الأقساط والتحصيلات.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications History List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-3">
            سجل الإشعارات والتنبيهات
          </h3>

          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  notif.read
                    ? 'bg-slate-50/60 border-slate-200 text-slate-600'
                    : 'bg-orange-50/60 border-orange-200 text-slate-900 font-bold shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        notif.type === 'warning'
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}
                    >
                      {notif.type === 'warning' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{notif.title}</h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{notif.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Free Gmail SMTP Email Config Box */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Mail className="w-5 h-5 text-[#f28913]" />
            <h3 className="font-extrabold text-slate-900 text-sm">إعدادات البريد المجاني (Gmail SMTP)</h3>
          </div>

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تم حفظ إعدادات إرسال الإشعارات بنجاح!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="font-bold text-slate-800">تفعيل الإرسال التلقائي للبريد</span>
              <input
                type="checkbox"
                checked={smtpState.enabled}
                onChange={(e) => setSmtpState({ ...smtpState, enabled: e.target.checked })}
                className="w-4 h-4 text-[#f28913] rounded-md focus:ring-0"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">عنوان بريد النظام المرسل (Gmail)</label>
              <input
                type="email"
                required
                value={smtpState.senderEmail}
                onChange={(e) => setSmtpState({ ...smtpState, senderEmail: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">البريد المستلم للإشعارات اليومية</label>
              <input
                type="email"
                required
                value={smtpState.recipientEmail}
                onChange={(e) => setSmtpState({ ...smtpState, recipientEmail: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">كلمة مرور التطبيق (App Password)</label>
              <input
                type="password"
                required
                value={smtpState.appPassword || ''}
                onChange={(e) => setSmtpState({ ...smtpState, appPassword: e.target.value })}
                placeholder="كلمة مرور التطبيق من حساب Google"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">يجب تفعيل التحقق بخطوتين في جوجل أولاً للحصول عليها.</p>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed bg-amber-50/60 p-3 rounded-2xl border border-amber-100">
              💡 <strong>ملحوظة:</strong> يتم استخدام خادم Gmail SMTP المجاني 100% لإرسال تقرير يومي بملخص الأقساط المستحقة وتنبيهات التحصيل.
            </p>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#f28913] hover:bg-[#d97a0e] text-white rounded-2xl font-bold text-xs shadow-lg shadow-orange-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>حفظ الإعدادات</span>
              </button>
              
              <button
                type="button"
                onClick={async () => {
                  setTestingEmail(true);
                  try {
                    await backendApi.testSmtpConfig();
                    alert('تم إرسال البريد التجريبي بنجاح! راجع بريدك الوارد.');
                  } catch (err: any) {
                    alert('فشل الإرسال: ' + err.message);
                  } finally {
                    setTestingEmail(false);
                  }
                }}
                disabled={testingEmail || !smtpState.appPassword || !smtpState.senderEmail}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-all disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                <span>{testingEmail ? 'جاري الإرسال...' : 'إرسال بريد تجريبي'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
