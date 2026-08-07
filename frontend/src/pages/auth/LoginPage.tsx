import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCustomerSupplierStore } from '../../store/customerSupplierStore';
import { useWoodStore } from '../../store/woodStore';
import { useTreasuryStore } from '../../store/treasuryStore';
import { useInvoiceStore } from '../../store/invoiceStore';
import { useReminderStore } from '../../store/reminderStore';

export const LoginPage: React.FC = () => {
  const { login, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('admin@elmahaba.com');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) {
      // Load all data from backend after login
      await Promise.all([
        useCustomerSupplierStore.getState().loadFromBackend(),
        useWoodStore.getState().loadFromBackend(),
        useTreasuryStore.getState().loadFromBackend(),
        useInvoiceStore.getState().loadFromBackend(),
        useReminderStore.getState().loadReminders(),
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px'
        }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-2xl mb-4">
            <span className="text-4xl">🪵</span>
          </div>
          <h1 className="text-3xl font-bold text-white">المهابة للأخشاب</h1>
          <p className="text-slate-400 mt-1">نظام إدارة المخزون والمحاسبة</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 text-center">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                placeholder="admin@elmahaba.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition pr-12"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 text-red-300 text-sm text-center">
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-900 font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  🔑 تسجيل الدخول
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <p className="text-center text-slate-500 text-xs mt-6">
            كلمة المرور الافتراضية: <span className="text-slate-300 font-mono">123456</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
