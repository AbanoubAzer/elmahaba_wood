import { create } from 'zustand';
import { backendApi } from '../services/api';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  emailSent: boolean;
  createdAt: string;
}

interface ReminderState {
  reminders: Reminder[];
  isLoading: boolean;
  loadReminders: () => Promise<void>;
  createReminder: (data: { title: string; description?: string; dueDate: string }) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set, get) => ({
  reminders: [],
  isLoading: false,

  loadReminders: async () => {
    set({ isLoading: true });
    try {
      const reminders = await backendApi.getReminders();
      set({ reminders, isLoading: false });
    } catch (err) {
      console.error('Failed to load reminders:', err);
      set({ isLoading: false });
    }
  },

  createReminder: async (data) => {
    try {
      await backendApi.createReminder(data);
      await get().loadReminders();
    } catch (err) {
      console.error('Failed to create reminder:', err);
      throw err;
    }
  },

  completeReminder: async (id) => {
    try {
      // Optimistic update
      set((state) => ({
        reminders: state.reminders.map((r) => r.id === id ? { ...r, isCompleted: true } : r)
      }));
      await backendApi.completeReminder(id);
    } catch (err) {
      console.error('Failed to complete reminder:', err);
      // Revert if failed
      await get().loadReminders();
    }
  },
}));
