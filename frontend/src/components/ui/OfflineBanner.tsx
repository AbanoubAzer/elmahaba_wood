import React, { useEffect, useState, useRef } from 'react';
import { API_BASE_URL } from '../../services/api';

type Status = 'online' | 'offline' | 'checking';

export const OfflineBanner: React.FC = () => {
  const [status, setStatus] = useState<Status>('checking');
  const intervalRef = useRef<number | undefined>(undefined);

  const checkConnectivity = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`${API_BASE_URL}/reports/summary`, {
        signal: controller.signal,
      });
      setStatus(res.ok ? 'online' : 'offline');
    } catch {
      setStatus('offline');
    } finally {
      clearTimeout(timeout);
    }
  };

  useEffect(() => {
    checkConnectivity();
    intervalRef.current = setInterval(checkConnectivity, 30_000);
    return () => clearInterval(intervalRef.current);
  }, []);

  if (status === 'online' || status === 'checking') return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium shadow-lg animate-slide-down"
      dir="rtl"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-red-200 animate-pulse" />
      الباك إند غير متاح — العمل في الوضع المحلي (البيانات لن تُحفظ)
      <button
        onClick={checkConnectivity}
        className="mr-3 underline underline-offset-2 opacity-80 hover:opacity-100"
      >
        إعادة المحاولة
      </button>
    </div>
  );
};
