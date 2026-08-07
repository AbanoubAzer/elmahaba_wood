import { create } from 'zustand';
import type { Treasury, TreasuryTransaction } from '../types';
import { backendApi } from '../services/api';

interface TreasuryState {
  treasuries: Treasury[];
  transactions: TreasuryTransaction[];
  isLoading: boolean;
  loadFromBackend: () => Promise<void>;
  addTreasury: (treasury: Omit<Treasury, 'id' | 'balance'>) => void;
  updateBalance: (id: string, amount: number, type: 'deposit' | 'withdrawal') => boolean;
  transferFunds: (fromId: string, toId: string, amount: number, notes: string, userName: string) => boolean;
}

// ─── Map backend → frontend shape ───────────────────────────────────────────
function mapTreasury(t: any): Treasury {
  return {
    id: t.id,
    name: t.name,
    type: (t.type as string).toLowerCase() as Treasury['type'],
    balance: Number(t.balance),
    accountNumber: t.accountNumber ?? undefined,
  };
}

function mapTransaction(tx: any): TreasuryTransaction {
  return {
    id: tx.id,
    date: tx.date ? new Date(tx.date).toISOString().split('T')[0] : '',
    fromTreasuryId: tx.fromTreasuryId ?? undefined,
    fromTreasuryName: tx.fromTreasuryName ?? undefined,
    toTreasuryId: tx.toTreasuryId ?? undefined,
    toTreasuryName: tx.toTreasuryName ?? undefined,
    amount: Number(tx.amount),
    type: tx.type ?? 'transfer',
    notes: tx.notes ?? '',
    createdBy: tx.createdBy,
  };
}

export const useTreasuryStore = create<TreasuryState>((set, get) => ({
  treasuries: [],
  transactions: [],
  isLoading: false,

  // ─── Load from backend ────────────────────────────────────────────────────
  loadFromBackend: async () => {
    set({ isLoading: true });
    try {
      const treasuriesRaw = await backendApi.getTreasuries();
      let transactionsRaw: any[] = [];
      try {
        transactionsRaw = await backendApi.getTreasuryTransactions();
      } catch {
        // Non-admin users can't access transactions — silently skip
      }
      set({
        treasuries: treasuriesRaw.map(mapTreasury),
        transactions: transactionsRaw.map(mapTransaction),
        isLoading: false,
      });
    } catch (err: any) {
      console.warn('[TreasuryStore] Backend offline — starting with empty data:', err.message);
      set({ isLoading: false });
    }
  },

  addTreasury: (data) => {
    const newTreasury: Treasury = {
      ...data,
      id: 't_' + Date.now(),
      balance: 0,
    };
    set((state) => ({ treasuries: [...state.treasuries, newTreasury] }));
  },

  // ─── updateBalance: returns false (with warning) if balance would go negative ──
  updateBalance: (id, amount, type) => {
    const treasury = get().treasuries.find((t) => t.id === id);
    if (!treasury) return false;

    if (type === 'withdrawal' && treasury.balance < amount) {
      console.warn(`[Treasury] Insufficient balance in "${treasury.name}": has ${treasury.balance}, needs ${amount}`);
      return false;
    }

    const newBal = type === 'deposit' ? treasury.balance + amount : treasury.balance - amount;

    set((state) => ({
      treasuries: state.treasuries.map((t) =>
        t.id === id ? { ...t, balance: newBal } : t
      ),
    }));

    // Sync to backend
    backendApi.updateTreasuryBalance(id, amount, type).catch((err: any) =>
      console.warn('[Treasury Update] Backend error:', err.message)
    );

    return true;
  },

  transferFunds: (fromId, toId, amount, notes, userName) => {
    const fromT = get().treasuries.find((t) => t.id === fromId);
    const toT = get().treasuries.find((t) => t.id === toId);

    if (!fromT || !toT) return false;
    if (fromT.balance < amount) {
      console.warn(`[Treasury Transfer] Insufficient balance in "${fromT.name}"`);
      return false;
    }

    const newTx: TreasuryTransaction = {
      id: 'tx_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      fromTreasuryId: fromId,
      fromTreasuryName: fromT.name,
      toTreasuryId: toId,
      toTreasuryName: toT.name,
      amount,
      type: 'transfer',
      notes,
      createdBy: userName,
    };

    set((state) => ({
      treasuries: state.treasuries.map((t) => {
        if (t.id === fromId) return { ...t, balance: t.balance - amount };
        if (t.id === toId) return { ...t, balance: t.balance + amount };
        return t;
      }),
      transactions: [newTx, ...state.transactions],
    }));

    // Sync transfer to backend
    backendApi.transferFunds({ fromId, toId, amount, notes, createdBy: userName }).catch((err: any) =>
      console.warn('[Treasury Transfer] Backend error:', err.message)
    );

    return true;
  },
}));
