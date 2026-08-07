import React, { useState } from 'react';
import { Database, Download, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { backendApi, API_BASE_URL } from '../../services/api';

export const DatabaseBackup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleExport = () => {
    // Navigate to the export endpoint, browser will download the file.
    // Need to pass the token in URL or rely on cookie? We use Bearer token.
    // Since it's a GET request downloading a file, we can fetch it as blob and trigger download.
    setLoading(true);
    fetch(`${API_BASE_URL}/backup/export`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('elmahaba_access_token')}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('فشل التصدير');
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `elmahaba-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch((err) => alert(err.message))
      .finally(() => setLoading(false));
  };

  const handleImport = async () => {
    if (!file) return;
    if (!window.confirm('تحذير شديد ⚠️: سيتم مسح قاعدة البيانات الحالية واستبدالها بهذه النسخة. هل أنت متأكد؟')) return;

    setLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await backendApi.importDatabase(data);
      alert('تم استعادة البيانات بنجاح! سيتم إعادة تحميل الصفحة.');
      window.location.reload();
    } catch (err: any) {
      alert('فشل استعادة البيانات: ' + (err.message || 'تأكد من أن الملف سليم.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-7 h-7 text-indigo-600" />
          النسخ الاحتياطي واستعادة البيانات
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          حماية بيانات الشركة عن طريق تصدير قاعدة البيانات بالكامل واستعادتها وقت الحاجة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 text-emerald-600">
            <Download className="w-6 h-6" />
            <h2 className="text-lg font-bold">تصدير (Backup)</h2>
          </div>
          <p className="text-sm text-slate-500">
            تحميل نسخة كاملة من النظام (العملاء، الموردين، الفواتير، المخزون) كملف JSON آمن.
          </p>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            تنزيل نسخة احتياطية
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 text-red-600">
            <Upload className="w-6 h-6" />
            <h2 className="text-lg font-bold">استعادة (Restore)</h2>
          </div>
          <p className="text-sm text-slate-500">
            رفع ملف JSON لاستعادة البيانات. 
            <span className="font-bold text-red-600 block mt-1">⚠️ هذه العملية ستمسح جميع البيانات الحالية بالكامل!</span>
          </p>
          
          <div className="space-y-3">
            <input 
              type="file" 
              accept=".json"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 outline-none"
            />
            <button
              onClick={handleImport}
              disabled={loading || !file}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertTriangle className="w-5 h-5" />}
              استعادة البيانات (حذف الحالي)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
