import { create } from 'zustand';
import { backendApi } from '../services/api';

export interface BankCheck {
  id: string;
  checkNumber: string;
  bankName: string;
  dueDate: string;
  amount: number;
  type: 'RECEIVABLE' | 'PAYABLE';
  partyId?: string;
  partyName: string;
  status: 'PENDING' | 'CLEARED' | 'BOUNCED';
  notes?: string;
  createdAt: string;
}

interface CheckStore {
  checks: BankCheck[];
  isLoading: boolean;
  loadChecks: () => Promise<void>;
  addCheck: (check: Omit<BankCheck, 'id' | 'createdAt'>) => Promise<void>;
  updateCheckStatus: (id: string, status: 'PENDING' | 'CLEARED' | 'BOUNCED') => Promise<void>;
  deleteCheck: (id: string) => Promise<void>;
}

export const useCheckStore = create<CheckStore>((set) => ({
  checks: [],
  isLoading: false,

  loadChecks: async () => {
    set({ isLoading: true });
    try {
      const data = await backendApi.request<BankCheck[]>('/checks');
      set({ checks: data });
    } catch (error) {
      console.error('Failed to load checks:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addCheck: async (check) => {
    const data = await backendApi.request<BankCheck>('/checks', {
      method: 'POST',
      body: JSON.stringify(check),
    });
    set((state) => ({ checks: [...state.checks, data] }));
  },

  updateCheckStatus: async (id, status) => {
    const updated = await backendApi.request<BankCheck>(`/checks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    set((state) => ({
      checks: state.checks.map((c) => (c.id === id ? updated : c)),
    }));
  },

  deleteCheck: async (id) => {
    await backendApi.request(`/checks/${id}`, { method: 'DELETE' });
    set((state) => ({
      checks: state.checks.filter((c) => c.id !== id),
    }));
  },
}));
