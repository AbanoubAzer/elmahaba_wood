import { create } from 'zustand';
import type { AuditLog, UserRole } from '../types';
import { backendApi } from '../services/api';

interface AuditState {
  logs: AuditLog[];
  isLoading: boolean;
  loadLogs: () => Promise<void>;
  logAction: (userRole: UserRole, userName: string, action: string, details: string) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  logs: [],
  isLoading: false,

  loadLogs: async () => {
    set({ isLoading: true });
    try {
      const data = await backendApi.getAuditLogs();
      const formattedLogs = data.map((log: any) => ({
        id: log.id,
        timestamp: new Date(log.timestamp).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }),
        userRole: log.userRole,
        userName: log.userName,
        action: log.action,
        details: log.details,
      }));
      set({ logs: formattedLogs });
    } catch (err: any) {
      console.warn('[Audit Store] Error loading logs:', err.message);
    } finally {
      set({ isLoading: false });
    }
  },

  logAction: (userRole, userName, action, details) => {
    const newLog: AuditLog = {
      id: 'temp_' + Date.now(),
      timestamp: new Date().toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }),
      userRole,
      userName,
      action,
      details,
    };
    
    // Optimistic UI update
    set((state) => ({ logs: [newLog, ...state.logs] }));

    // Send to backend
    backendApi.createAuditLog({ userRole, userName, action, details }).catch(err => {
      console.error('[Audit Store] Failed to create audit log:', err);
    });
  },
}));
