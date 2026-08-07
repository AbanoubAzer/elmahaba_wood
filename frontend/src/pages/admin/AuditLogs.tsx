import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Loader2 } from 'lucide-react';
import { useAuditStore } from '../../store/auditStore';

export const AuditLogs: React.FC = () => {
  const { logs, isLoading, loadLogs } = useAuditStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(
    (log) =>
      log.userName.includes(searchTerm) ||
      log.action.includes(searchTerm) ||
      log.details.includes(searchTerm) ||
      log.timestamp.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#f28913]" />
          <span>سجل نشاطات المستخدمين (Audit Logs)</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          شاشة مخصصة لمدير النظام لتتبع كافة الحركات والإجراءات باليوم والساعة والدقيقة لحماية النظام.
        </p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="فلترة باسم المستخدم، الفاتورة، الحركة أو التوقيت..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#f28913]/30"
          />
        </div>
        <div className="text-xs font-bold text-slate-500">
          إجمالي الحركات المسجلة: <span className="text-[#f28913]">{filteredLogs.length}</span>
        </div>
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[#f28913]" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-3.5 px-4 font-bold">التوقيت واليوم</th>
                <th className="py-3.5 px-4 font-bold">المستخدم</th>
                <th className="py-3.5 px-4 font-bold">الصلاحية</th>
                <th className="py-3.5 px-4 font-bold">نوع الحركة / الإجراء</th>
                <th className="py-3.5 px-4 font-bold">التفاصيل الكاملة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-all font-medium">
                  <td className="py-3.5 px-4 font-mono text-slate-500">{log.timestamp}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{log.userName}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        log.userRole === 'admin'
                          ? 'bg-orange-100 text-orange-800'
                          : log.userRole === 'accountant'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {log.userRole === 'admin' ? 'مدير' : log.userRole === 'accountant' ? 'محاسب' : 'مخزنجي'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{log.action}</td>
                  <td className="py-3.5 px-4 text-slate-600 leading-relaxed">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
};
