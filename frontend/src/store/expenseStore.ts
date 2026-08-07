import { create } from 'zustand';
import type { Expense } from '../types';
import { backendApi } from '../services/api';
import { useAuthStore } from './authStore';
import { useAuditStore } from './auditStore';

export const EXPENSE_CATEGORIES = [
  'رواتب وأجور',
  'كهرباء ومياه',
  'إيجارات',
  'صيانة',
  'نقل ونولون',
  'بوفيه ونثريات',
  'أخرى'
];

interface ExpenseState {
  expenses: Expense[];
  isLoading: boolean;
  loadFromBackend: () => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

export const useExpenseStore = create<ExpenseState>((set) => ({
  expenses: [],
  isLoading: false,

  loadFromBackend: async () => {
    set({ isLoading: true });
    try {
      const data = await backendApi.getExpenses();
      const formattedData = data.map((d: any) => ({
        ...d,
        date: new Date(d.date).toISOString().split('T')[0],
        amount: Number(d.amount),
      }));
      set({ expenses: formattedData, isLoading: false });
    } catch (err) {
      console.error('[ExpenseStore] Failed to load expenses', err);
      set({ isLoading: false });
    }
  },

  addExpense: async (data) => {
    try {
      const newExp = await backendApi.createExpense(data);
      const formattedExp = {
        ...newExp,
        date: new Date(newExp.date).toISOString().split('T')[0],
        amount: Number(newExp.amount),
      };
      set((state) => ({ expenses: [formattedExp, ...state.expenses] }));

      const currentUser = useAuthStore.getState().currentUser;
      useAuditStore.getState().logAction(
        currentUser?.role || 'admin',
        currentUser?.name || 'النظام',
        'تسجيل مصروف',
        `تم تسجيل مصروف (${data.category}): ${data.description} بقيمة ${data.amount}`
      );
    } catch (err) {
      console.error('Failed to create expense:', err);
    }
  },

  deleteExpense: async (id) => {
    try {
      await backendApi.deleteExpense(id);
      set((state) => ({ expenses: state.expenses.filter((exp) => exp.id !== id) }));
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  },
}));
