import { create } from 'zustand';
import type { Customer, Supplier, LedgerEntry } from '../types';
import { backendApi } from '../services/api';
import { useAuthStore } from './authStore';
import { useAuditStore } from './auditStore';

interface CustomerSupplierState {
  customers: Customer[];
  suppliers: Supplier[];
  ledgerEntries: LedgerEntry[];
  isLoading: boolean;
  // Data loading
  loadFromBackend: () => Promise<void>;
  // Customers
  addCustomer: (customer: Omit<Customer, 'id' | 'balance' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => void;
  // Suppliers
  addSupplier: (supplier: Omit<Supplier, 'id' | 'balance' | 'createdAt'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => void;
  // Ledger
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id' | 'balance'>) => void;
  getCustomerLedger: (customerId: string) => LedgerEntry[];
  getSupplierLedger: (supplierId: string) => LedgerEntry[];
}

// ─── Helpers: map backend shape → frontend shape ───────────────────────────
function mapCustomer(c: any): Customer {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    address: c.address,
    notes: c.notes ?? '',
    balance: Number(c.balance),
    createdAt: c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
  };
}

function mapSupplier(s: any): Supplier {
  return {
    id: s.id,
    name: s.name,
    phone: s.phone,
    address: s.address,
    notes: s.notes ?? '',
    balance: Number(s.balance),
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : '',
  };
}

function mapInvoiceForLedger(inv: any) {
  if (!inv) return undefined;
  return {
    ...inv,
    totalVolumeM3: Number(inv.totalVolumeM3),
    totalAmount: Number(inv.totalAmount),
    paidAmount: Number(inv.paidAmount),
    remainingAmount: Number(inv.remainingAmount),
    items: (inv.items ?? []).map((i: any) => ({
      ...i,
      volumeM3: Number(i.volumeM3),
      pricePerM3: Number(i.pricePerM3),
      total: Number(i.total),
    })),
  };
}

function mapLedgerEntry(e: any): LedgerEntry {
  return {
    id: e.id,
    date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
    partyType: (e.partyType as string).toLowerCase() as 'customer' | 'supplier',
    partyId: e.partyId,
    partyName: e.partyName,
    description: e.description,
    woodSpecs: e.woodSpecs ?? '',
    volumeM3: e.volumeM3 ? Number(e.volumeM3) : undefined,
    pricePerM3: e.pricePerM3 ? Number(e.pricePerM3) : undefined,
    debit: Number(e.debit ?? 0),
    credit: Number(e.credit ?? 0),
    balance: Number(e.balance ?? 0),
    invoiceId: e.invoiceId ?? undefined,
    invoice: e.invoice ? mapInvoiceForLedger(e.invoice) : undefined,
    notes: e.notes ?? '',
  };
}

export const useCustomerSupplierStore = create<CustomerSupplierState>((set, get) => ({
  customers: [],
  suppliers: [],
  ledgerEntries: [],
  isLoading: false,

  // ─── Load all data from backend on app startup ───────────────────────────
  loadFromBackend: async () => {
    set({ isLoading: true });
    try {
      const [customersRaw, suppliersRaw] = await Promise.all([
        backendApi.getCustomers(),
        backendApi.getSuppliers(),
      ]);

      let ledgerRaw: any[] = [];
      try {
        ledgerRaw = await backendApi.getAllLedgerEntries();
      } catch {
        // Non-admin users can't access ledger — silently skip
      }

      set({
        customers: customersRaw.map(mapCustomer),
        suppliers: suppliersRaw.map(mapSupplier),
        ledgerEntries: ledgerRaw.map(mapLedgerEntry),
        isLoading: false,
      });
    } catch (err: any) {
      console.warn('[Store] Backend offline — starting with empty data:', err.message);
      set({ isLoading: false });
    }
  },

  // ─── Customers ───────────────────────────────────────────────────────────
  addCustomer: (data) => {
    const newCust: Customer = {
      ...data,
      id: 'c_' + Date.now(),
      balance: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ customers: [newCust, ...state.customers] }));

    const currentUser = useAuthStore.getState().currentUser;
    useAuditStore.getState().logAction(
      currentUser?.role || 'admin',
      currentUser?.name || 'النظام',
      'إضافة عميل',
      `تم إضافة عميل جديد: ${data.name}`
    );

    backendApi.createCustomer(data).then((res: any) => {
      // Replace local temp id with real DB id
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === newCust.id ? mapCustomer(res) : c
        ),
      }));
    }).catch((err: any) => console.warn('[Customer Create] Backend error:', err.message));
  },

  updateCustomer: async (id, data) => {
    try {
      await backendApi.updateCustomer(id, data);
      set((state) => ({
        customers: state.customers.map((c) => (c.id === id ? { ...c, ...data } : c)),
      }));

      const currentUser = useAuthStore.getState().currentUser;
      const cust = get().customers.find(c => c.id === id);
      useAuditStore.getState().logAction(
        currentUser?.role || 'admin',
        currentUser?.name || 'النظام',
        'تعديل عميل',
        `تم تعديل بيانات العميل: ${cust?.name || id}`
      );
    } catch (err: any) {
      console.error('[Customer Update] Backend error:', err.message);
      throw err;
    }
  },

  deleteCustomer: (id) => {
    const cust = get().customers.find(c => c.id === id);
    set((state) => ({ customers: state.customers.filter((c) => c.id !== id) }));

    const currentUser = useAuthStore.getState().currentUser;
    useAuditStore.getState().logAction(
      currentUser?.role || 'admin',
      currentUser?.name || 'النظام',
      'حذف عميل',
      `تم حذف العميل: ${cust?.name || id}`
    );
  },

  // ─── Suppliers ───────────────────────────────────────────────────────────
  addSupplier: (data) => {
    const newSupp: Supplier = {
      ...data,
      id: 's_' + Date.now(),
      balance: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ suppliers: [newSupp, ...state.suppliers] }));

    const currentUser = useAuthStore.getState().currentUser;
    useAuditStore.getState().logAction(
      currentUser?.role || 'admin',
      currentUser?.name || 'النظام',
      'إضافة مورد',
      `تم إضافة مورد جديد: ${data.name}`
    );

    backendApi.createSupplier(data).then((res: any) => {
      set((state) => ({
        suppliers: state.suppliers.map((s) =>
          s.id === newSupp.id ? mapSupplier(res) : s
        ),
      }));
    }).catch((err: any) => console.warn('[Supplier Create] Backend error:', err.message));
  },

  updateSupplier: async (id, data) => {
    try {
      await backendApi.updateSupplier(id, data);
      set((state) => ({
        suppliers: state.suppliers.map((s) => (s.id === id ? { ...s, ...data } : s)),
      }));

      const currentUser = useAuthStore.getState().currentUser;
      const supp = get().suppliers.find(s => s.id === id);
      useAuditStore.getState().logAction(
        currentUser?.role || 'admin',
        currentUser?.name || 'النظام',
        'تعديل مورد',
        `تم تعديل بيانات المورد: ${supp?.name || id}`
      );
    } catch (err: any) {
      console.error('[Supplier Update] Backend error:', err.message);
      throw err;
    }
  },

  deleteSupplier: (id) => {
    const supp = get().suppliers.find(s => s.id === id);
    set((state) => ({ suppliers: state.suppliers.filter((s) => s.id !== id) }));

    const currentUser = useAuthStore.getState().currentUser;
    useAuditStore.getState().logAction(
      currentUser?.role || 'admin',
      currentUser?.name || 'النظام',
      'حذف مورد',
      `تم حذف المورد: ${supp?.name || id}`
    );
  },

  // ─── Ledger Entries ───────────────────────────────────────────────────────
  addLedgerEntry: (entryData) => {
    const currentPartyLedger =
      entryData.partyType === 'customer'
        ? get().getCustomerLedger(entryData.partyId)
        : get().getSupplierLedger(entryData.partyId);

    const prevBalance =
      currentPartyLedger.length > 0
        ? currentPartyLedger[currentPartyLedger.length - 1].balance
        : 0;

    const newBalance =
      entryData.partyType === 'customer'
        ? prevBalance + entryData.debit - entryData.credit
        : prevBalance + entryData.credit - entryData.debit;

    const newEntry: LedgerEntry = {
      ...entryData,
      id: 'l_' + Date.now(),
      balance: newBalance,
    };

    set((state) => ({
      ledgerEntries: [...state.ledgerEntries, newEntry],
      customers: state.customers.map((c) =>
        c.id === entryData.partyId && entryData.partyType === 'customer'
          ? { ...c, balance: newBalance }
          : c
      ),
      suppliers: state.suppliers.map((s) =>
        s.id === entryData.partyId && entryData.partyType === 'supplier'
          ? { ...s, balance: newBalance }
          : s
      ),
    }));

    // Call API in the background
    if (entryData.partyType === 'customer') {
      backendApi.addCustomerLedgerEntry(entryData.partyId, entryData).catch(err => {
        console.error('Failed to add customer ledger entry:', err);
      });
    } else {
      backendApi.addSupplierLedgerEntry(entryData.partyId, entryData).catch(err => {
        console.error('Failed to add supplier ledger entry:', err);
      });
    }
  },

  getCustomerLedger: (customerId: string) => {
    return get().ledgerEntries.filter(
      (e) => e.partyType === 'customer' && e.partyId === customerId
    );
  },

  getSupplierLedger: (supplierId: string) => {
    return get().ledgerEntries.filter(
      (e) => e.partyType === 'supplier' && e.partyId === supplierId
    );
  },
}));
