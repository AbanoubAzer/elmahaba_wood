import { create } from 'zustand';
import type { Custody } from '../types';
import { backendApi } from '../services/api';
import { getEgyptToday } from '../utils/numberUtils';

interface CustodyState {
  custodies: Custody[];
  isLoading: boolean;
  loadFromBackend: () => Promise<void>;
  addCustody: (data: {
    personName: string;
    phone?: string;
    location?: string;
    amount: number;
    expectedReturnDate?: string;
    delivered?: boolean;
    notes?: string;
  }) => Promise<void>;
  updateCustody: (id: string, data: Partial<Custody>) => Promise<void>;
  toggleDelivered: (id: string) => Promise<void>;
  deleteCustody: (id: string) => Promise<void>;
}

export const useCustodyStore = create<CustodyState>((set, get) => ({
  custodies: [],
  isLoading: false,

  loadFromBackend: async () => {
    set({ isLoading: true });
    try {
      const data = await backendApi.getCustodies();
      const formatted = data.map((d: any) => ({
        ...d,
        amount: Number(d.amount),
        expectedReturnDate: d.expectedReturnDate
          ? new Date(d.expectedReturnDate).toISOString().split('T')[0]
          : undefined,
        deliveredDate: d.deliveredDate
          ? new Date(d.deliveredDate).toISOString().split('T')[0]
          : undefined,
        createdAt: d.createdAt
          ? new Date(d.createdAt).toISOString()
          : new Date().toISOString(),
      }));
      set({ custodies: formatted, isLoading: false });
    } catch (err) {
      console.error('[CustodyStore] Failed to load custodies:', err);
      set({ isLoading: false });
    }
  },

  addCustody: async (data) => {
    try {
      const newRec = await backendApi.createCustody(data);
      const formatted: Custody = {
        ...newRec,
        amount: Number(newRec.amount),
        expectedReturnDate: newRec.expectedReturnDate
          ? new Date(newRec.expectedReturnDate).toISOString().split('T')[0]
          : undefined,
        deliveredDate: newRec.deliveredDate
          ? new Date(newRec.deliveredDate).toISOString().split('T')[0]
          : undefined,
      };
      set((state) => ({ custodies: [formatted, ...state.custodies] }));
    } catch (err) {
      console.error('[CustodyStore] Failed to add custody:', err);
      throw err;
    }
  },

  updateCustody: async (id, data) => {
    try {
      const updated = await backendApi.updateCustody(id, data);
      const formatted: Custody = {
        ...updated,
        amount: Number(updated.amount),
        expectedReturnDate: updated.expectedReturnDate
          ? new Date(updated.expectedReturnDate).toISOString().split('T')[0]
          : undefined,
        deliveredDate: updated.deliveredDate
          ? new Date(updated.deliveredDate).toISOString().split('T')[0]
          : undefined,
      };
      set((state) => ({
        custodies: state.custodies.map((c) => (c.id === id ? formatted : c)),
      }));
    } catch (err) {
      console.error('[CustodyStore] Failed to update custody:', err);
      throw err;
    }
  },

  toggleDelivered: async (id) => {
    const item = get().custodies.find((c) => c.id === id);
    if (!item) return;

    const nextDelivered = !item.delivered;
    const today = getEgyptToday();

    // Optimistic update
    set((state) => ({
      custodies: state.custodies.map((c) =>
        c.id === id
          ? {
              ...c,
              delivered: nextDelivered,
              deliveredDate: nextDelivered ? today : undefined,
            }
          : c
      ),
    }));

    try {
      await backendApi.toggleCustodyDelivered(id, nextDelivered);
    } catch (err) {
      console.error('[CustodyStore] Failed to toggle delivered status:', err);
      // Revert on error
      set((state) => ({
        custodies: state.custodies.map((c) => (c.id === id ? item : c)),
      }));
      throw err;
    }
  },

  deleteCustody: async (id) => {
    try {
      await backendApi.deleteCustody(id);
      set((state) => ({
        custodies: state.custodies.filter((c) => c.id !== id),
      }));
    } catch (err) {
      console.error('[CustodyStore] Failed to delete custody:', err);
      throw err;
    }
  },
}));
