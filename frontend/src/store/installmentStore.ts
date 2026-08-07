import { create } from 'zustand';
import type { Installment } from '../types';
import { backendApi } from '../services/api';

interface InstallmentState {
  installments: Installment[];
  isLoading: boolean;
  loadFromBackend: () => Promise<void>;
  addInstallment: (installment: Omit<Installment, 'id' | 'paid'>) => Promise<void>;
  togglePaid: (id: string) => Promise<void>;
  deleteInstallment: (id: string) => Promise<void>;
}

export const useInstallmentStore = create<InstallmentState>((set, get) => ({
  installments: [],
  isLoading: false,

  loadFromBackend: async () => {
    set({ isLoading: true });
    try {
      const data = await backendApi.getInstallments();
      // data from Prisma has dates as strings or Dates, ensure they are formatted properly if needed
      const formattedData = data.map((d: any) => ({
        ...d,
        dueDate: new Date(d.dueDate).toISOString().split('T')[0],
        paidDate: d.paidDate ? new Date(d.paidDate).toISOString().split('T')[0] : undefined,
      }));
      set({ installments: formattedData, isLoading: false });
    } catch (err) {
      console.error('[InstallmentStore] Failed to load installments', err);
      set({ isLoading: false });
    }
  },

  addInstallment: async (data) => {
    try {
      const newInst = await backendApi.createInstallment(data);
      const formattedInst = {
        ...newInst,
        dueDate: new Date(newInst.dueDate).toISOString().split('T')[0],
      };
      set((state) => ({ installments: [formattedInst, ...state.installments] }));
    } catch (err) {
      console.error('Failed to create installment:', err);
    }
  },

  togglePaid: async (id) => {
    const inst = get().installments.find((i) => i.id === id);
    if (!inst) return;
    
    const nextPaid = !inst.paid;
    
    // Optimistic update
    set((state) => ({
      installments: state.installments.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            paid: nextPaid,
            paidDate: nextPaid ? new Date().toISOString().split('T')[0] : undefined,
          };
        }
        return i;
      }),
    }));

    try {
      await backendApi.toggleInstallmentPaid(id, nextPaid);
    } catch (err) {
      console.error('Failed to toggle paid status:', err);
      // Revert on failure
      set((state) => ({
        installments: state.installments.map((i) => {
          if (i.id === id) {
            return {
              ...i,
              paid: inst.paid,
              paidDate: inst.paidDate,
            };
          }
          return i;
        }),
      }));
    }
  },

  deleteInstallment: async (id) => {
    try {
      await backendApi.deleteInstallment(id);
      set((state) => ({ installments: state.installments.filter((inst) => inst.id !== id) }));
    } catch (err) {
      console.error('Failed to delete installment:', err);
    }
  },
}));
