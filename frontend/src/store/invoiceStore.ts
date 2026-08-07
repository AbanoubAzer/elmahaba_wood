import { create } from 'zustand';
import type { Invoice } from '../types';
import { useWoodStore } from './woodStore';
import { useCustomerSupplierStore } from './customerSupplierStore';
import { useTreasuryStore } from './treasuryStore';
import { useAuthStore } from './authStore';
import { useAuditStore } from './auditStore';
import { backendApi } from '../services/api';

interface InvoiceState {
  invoices: Invoice[];
  isLoading: boolean;
  loadFromBackend: () => Promise<void>;
  createInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNo' | 'status'>, userName: string, userRole: string) => Promise<string>;
  recordPayment: (invoiceId: string, amount: number, treasuryId: string, notes?: string) => Promise<boolean>;
  cancelInvoice: (invoiceId: string, createdBy: string) => Promise<boolean>;
  getInvoice: (id: string) => Invoice | undefined;
}

// ─── Map backend shape → frontend shape ──────────────────────────────────
function mapInvoice(inv: any): Invoice {
  return {
    id: inv.id,
    invoiceNo: inv.invoiceNo,
    date: inv.date ? new Date(inv.date).toISOString().split('T')[0] : '',
    type: (inv.type as string).toLowerCase() as 'sale' | 'purchase',
    partyType: (inv.partyType as string).toLowerCase() as 'customer' | 'supplier',
    partyId: inv.partyId,
    partyName: inv.partyName,
    items: (inv.items ?? []).map((i: any) => ({
      productId: i.productId,
      productCode: i.productCode,
      productName: i.productName,
      volumeM3: Number(i.volumeM3),
      pricePerM3: Number(i.pricePerM3),
      total: Number(i.total),
    })),
    totalVolumeM3: Number(inv.totalVolumeM3),
    totalAmount: Number(inv.totalAmount),
    paidAmount: Number(inv.paidAmount),
    remainingAmount: Number(inv.remainingAmount),
    paymentType: (inv.paymentType as string).toLowerCase() as 'cash' | 'credit' | 'partial',
    paymentMethod: (inv.paymentMethod as string).toLowerCase() as Invoice['paymentMethod'],
    treasuryId: inv.treasuryId,
    notes: inv.notes ?? '',
    status: (inv.status as string).toLowerCase() as 'paid' | 'partial' | 'unpaid',
    createdBy: inv.createdBy,
  };
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: [],
  isLoading: false,

  // ─── Load invoices from backend on startup ────────────────────────────────
  loadFromBackend: async () => {
    set({ isLoading: true });
    try {
      const raw = await backendApi.getInvoices();
      set({ invoices: raw.map(mapInvoice), isLoading: false });
    } catch (err: any) {
      console.warn('[InvoiceStore] Backend offline — starting with empty invoices:', err.message);
      set({ isLoading: false });
    }
  },

  createInvoice: async (data, userName, userRole) => {
    const tempInvoiceNo = `TMP-${Date.now().toString().slice(-4)}`;
    
    const currentUser = useAuthStore.getState().currentUser;
    let resolvedCreatedBy = userName || currentUser?.name || 'النظام';
    if (userRole === 'admin' && data.createdBy) {
      resolvedCreatedBy = data.createdBy;
    }

    const totalAmount = data.items.reduce((sum, item) => sum + item.total, 0);
    const totalVolumeM3 = data.items.reduce((sum, item) => sum + item.volumeM3, 0);
    const paidAmount = data.paidAmount || 0;
    const remainingAmount = totalAmount - paidAmount;
    
    const status: Invoice['status'] = paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

    let createdInvoice;
    try {
      createdInvoice = await backendApi.createInvoice({
        ...data,
        invoiceNo: tempInvoiceNo,
        status,
        remainingAmount: Math.max(0, remainingAmount),
        createdBy: resolvedCreatedBy,
      });
      console.info(`[Backend Sync ✅] Invoice ${createdInvoice.invoiceNo} persisted to PostgreSQL`);
    } catch (err: any) {
      console.warn(`[Backend Sync ⚠] Failed to save invoice:`, err.message);
      const errorMsg = err.response?.data?.message || err.message || 'فشل في حفظ الفاتورة';
      throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    }

    const newInvoice: Invoice = {
      id: createdInvoice.id,
      invoiceNo: createdInvoice.invoiceNo,
      date: data.date,
      type: data.type,
      partyType: data.partyType,
      partyId: data.partyId,
      partyName: data.partyName,
      items: data.items.map((i: any) => ({ ...i, id: Math.random().toString(36).substr(2, 9) })),
      totalVolumeM3,
      totalAmount,
      paidAmount,
      remainingAmount: Math.max(0, remainingAmount),
      paymentType: data.paymentType || 'cash',
      paymentMethod: data.paymentMethod || 'cash',
      treasuryId: data.treasuryId,
      notes: data.notes,
      status,
      createdBy: resolvedCreatedBy,
    };

    set((state) => ({ invoices: [newInvoice, ...state.invoices] }));

    // Reload other stores to ensure local state reflects the backend transaction
    useWoodStore.getState().loadFromBackend();
    useCustomerSupplierStore.getState().loadFromBackend();
    useTreasuryStore.getState().loadFromBackend();

    useAuditStore.getState().logAction(
      currentUser?.role || 'admin',
      resolvedCreatedBy,
      'إنشاء فاتورة',
      `فاتورة ${data.type === 'sale' ? 'بيع' : 'شراء'} رقم ${createdInvoice.invoiceNo} بقيمة ${totalAmount}`
    );

    return newInvoice.id;
  },

  getInvoice: (id: string) => {
    return get().invoices.find((i) => i.id === id);
  },

  // ─── Record partial payment on existing invoice ────────────────────────────
  recordPayment: async (invoiceId, amount, treasuryId, notes) => {
    const currentUser = useAuthStore.getState().currentUser;
    const createdBy = currentUser?.name || 'النظام';

    try {
      await backendApi.recordPayment(invoiceId, { amount, treasuryId, createdBy, notes });

      // Update local state
      set((state) => ({
        invoices: state.invoices.map((inv) => {
          if (inv.id !== invoiceId) return inv;
          const newPaid = inv.paidAmount + amount;
          const newRemaining = Math.max(0, inv.remainingAmount - amount);
          const newStatus: Invoice['status'] = newRemaining <= 0 ? 'paid' : 'partial';
          return { ...inv, paidAmount: newPaid, remainingAmount: newRemaining, status: newStatus };
        }),
      }));

      // Update treasury
      useTreasuryStore.getState().updateBalance(treasuryId, amount, 'deposit');

      return true;
    } catch (err: any) {
      console.warn('[recordPayment] Backend error:', err.message);
      return false;
    }
  },

  // ─── Cancel Invoice ────────────────────────────────────────────────────────
  cancelInvoice: async (invoiceId, createdBy) => {
    try {
      await backendApi.cancelInvoice(invoiceId, createdBy);

      // Update local state
      set((state) => ({
        invoices: state.invoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: 'cancelled' as any } : inv
        ),
      }));

      // Reload other stores
      useWoodStore.getState().loadFromBackend();
      useCustomerSupplierStore.getState().loadFromBackend();
      useTreasuryStore.getState().loadFromBackend();

      const currentUser = useAuthStore.getState().currentUser;
      const inv = get().invoices.find(i => i.id === invoiceId);
      useAuditStore.getState().logAction(
        currentUser?.role || 'admin',
        currentUser?.name || 'النظام',
        'إلغاء فاتورة',
        `تم إلغاء فاتورة رقم ${inv?.invoiceNo || invoiceId}`
      );

      return true;
    } catch (err: any) {
      console.warn('[cancelInvoice] Backend error:', err.message);
      const errorMsg = err.response?.data?.message || err.message || 'فشل في إلغاء الفاتورة';
      throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    }
  },
}));
