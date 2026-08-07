import { create } from 'zustand';
import type { WoodProduct, InventoryMovement } from '../types';
import { backendApi } from '../services/api';
import { useAuthStore } from './authStore';
import { useAuditStore } from './auditStore';

export interface BatchShipmentItem {
  productId: string;
  volumeM3: number;
  pricePerM3: number;
}

interface WoodState {
  products: WoodProduct[];
  movements: InventoryMovement[];
  isLoading: boolean;
  loadFromBackend: () => Promise<void>;
  addProduct: (product: Omit<WoodProduct, 'id'>) => void;
  updateProduct: (id: string, product: Partial<WoodProduct>) => void;
  deleteProduct: (id: string) => Promise<void>;
  // addStockShipment delegates to addBatchShipment (single-item batch)
  addStockShipment: (productId: string, volumeM3: number, pricePerM3: number, invoiceNo: string, notes: string, userName: string) => void;
  addBatchShipment: (items: BatchShipmentItem[], invoiceNo: string, notes: string, userName: string) => void;
  adjustStock: (productId: string, deltaM3: number, type: 'in' | 'out', invoiceNo: string, pricePerM3: number, userName: string, notes?: string) => void;
}

// ─── Helpers: map backend shape → frontend shape ───────────────────────────
function mapProduct(p: any): WoodProduct {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    specs: p.specs,
    volumeM3: Number(p.volumeM3),
    pricePerM3: Number(p.pricePerM3),
    minStockM3: Number(p.minStockM3),
    notes: p.notes ?? '',
  };
}

function mapMovement(m: any): InventoryMovement {
  return {
    id: m.id,
    date: m.date ? new Date(m.date).toISOString().split('T')[0] : '',
    invoiceNo: m.invoiceNo,
    type: (m.type as string).toLowerCase() as 'in' | 'out',
    productId: m.productId,
    productName: m.productName,
    productCode: m.productCode,
    volumeM3: Number(m.volumeM3),
    pricePerM3: Number(m.pricePerM3),
    totalValue: Number(m.totalValue),
    notes: m.notes ?? '',
    createdBy: m.createdBy,
  };
}

export const useWoodStore = create<WoodState>((set, get) => ({
  products: [],
  movements: [],
  isLoading: false,

  // ─── Load from backend ────────────────────────────────────────────────────
  loadFromBackend: async () => {
    set({ isLoading: true });
    try {
      const [productsRaw, movementsRaw] = await Promise.all([
        backendApi.getWoodProducts(),
        backendApi.getInventoryMovements(),
      ]);
      set({
        products: productsRaw.map(mapProduct),
        movements: movementsRaw.map(mapMovement),
        isLoading: false,
      });
    } catch (err: any) {
      console.warn('[WoodStore] Backend offline — starting with empty data:', err.message);
      set({ isLoading: false });
    }
  },

  // ─── Products CRUD ────────────────────────────────────────────────────────
  addProduct: (productData) => {
    const tempId = 'p_' + Date.now();
    const newProduct: WoodProduct = {
      ...productData,
      id: tempId,
      volumeM3: Number(productData.volumeM3.toFixed(4)),
    };
    set((state) => ({ products: [newProduct, ...state.products] }));

    const currentUser = useAuthStore.getState().currentUser;
    useAuditStore.getState().logAction(
      currentUser?.role || 'admin',
      currentUser?.name || 'النظام',
      'إضافة صنف',
      `تم إضافة صنف خشب جديد: ${productData.name} (${productData.code})`
    );

    backendApi.createWoodProduct(productData).then((res: any) => {
      // Replace temp id with real DB UUID
      set((state) => ({
        products: state.products.map((p) => (p.id === tempId ? mapProduct(res) : p)),
      }));
    }).catch((err: any) => console.warn('[WoodProduct Create] Backend error:', err.message));
  },

  updateProduct: (id, updatedData) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updatedData,
              volumeM3: updatedData.volumeM3 !== undefined ? Number(updatedData.volumeM3.toFixed(4)) : p.volumeM3,
            }
          : p
      ),
    }));

    const currentUser = useAuthStore.getState().currentUser;
    const product = get().products.find(p => p.id === id);
    useAuditStore.getState().logAction(
      currentUser?.role || 'admin',
      currentUser?.name || 'النظام',
      'تعديل صنف',
      `تم تعديل بيانات صنف: ${product?.name || id}`
    );
    backendApi.updateWoodProduct(id, updatedData).catch((err: any) =>
      console.warn('[WoodProduct Update] Backend error:', err.message)
    );
  },

  deleteProduct: async (id) => {
    try {
      await backendApi.deleteWoodProduct(id);
      const product = get().products.find(p => p.id === id);
    set((state) => ({ products: state.products.filter((p) => p.id !== id) }));

    const currentUser = useAuthStore.getState().currentUser;
    useAuditStore.getState().logAction(
      currentUser?.role || 'admin',
      currentUser?.name || 'النظام',
      'حذف صنف',
      `تم حذف صنف خشب: ${product?.name || id}`
    );
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'فشل في حذف الصنف';
      throw new Error(Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg);
    }
  },

  // ─── addStockShipment: delegates to addBatchShipment (DRY) ───────────────
  addStockShipment: (productId, volumeM3, pricePerM3, invoiceNo, notes, userName) => {
    get().addBatchShipment([{ productId, volumeM3, pricePerM3 }], invoiceNo, notes, userName);
  },

  // ─── addBatchShipment: FIX — accumulate deltas correctly ─────────────────
  addBatchShipment: (items, invoiceNo, notes, userName) => {
    const allProducts = get().products;
    const newMovements: InventoryMovement[] = [];
    // Map productId → total volume delta (supports same product twice in batch)
    const volumeDeltas: Record<string, number> = {};
    const latestPrice: Record<string, number> = {};

    items.forEach((item, idx) => {
      const prod = allProducts.find((p) => p.id === item.productId);
      if (!prod) return;
      const formattedVolume = Number(item.volumeM3.toFixed(4));

      newMovements.push({
        id: 'm_batch_' + Date.now() + '_' + idx,
        date: new Date().toISOString().split('T')[0],
        invoiceNo,
        type: 'in',
        productId: item.productId,
        productName: prod.name,
        productCode: prod.code,
        volumeM3: formattedVolume,
        pricePerM3: item.pricePerM3,
        totalValue: formattedVolume * item.pricePerM3,
        notes,
        createdBy: userName,
      });

      // Accumulate delta (fixed bug: use delta, not prod.volumeM3 as base)
      volumeDeltas[item.productId] = (volumeDeltas[item.productId] ?? 0) + formattedVolume;
      latestPrice[item.productId] = item.pricePerM3;
    });

    set((state) => ({
      products: state.products.map((p) =>
        volumeDeltas[p.id] !== undefined
          ? {
              ...p,
              volumeM3: Number((p.volumeM3 + volumeDeltas[p.id]).toFixed(4)),
              pricePerM3: latestPrice[p.id],
            }
          : p
      ),
      movements: [...newMovements, ...state.movements],
    }));
  },

  // ─── adjustStock (used by invoice creation for sales/purchases) ───────────
  adjustStock: (productId, deltaM3, type, invoiceNo, pricePerM3, userName, notes) => {
    const prod = get().products.find((p) => p.id === productId);
    if (!prod) return;

    const formattedVolume = Number(deltaM3.toFixed(4));
    const newMovement: InventoryMovement = {
      id: 'm_' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      invoiceNo,
      type,
      productId,
      productName: prod.name,
      productCode: prod.code,
      volumeM3: formattedVolume,
      pricePerM3,
      totalValue: formattedVolume * pricePerM3,
      notes,
      createdBy: userName,
    };

    set((state) => ({
      products: state.products.map((p) => {
        if (p.id === productId) {
          const newVol = type === 'in' ? p.volumeM3 + formattedVolume : p.volumeM3 - formattedVolume;
          return { ...p, volumeM3: Number(Math.max(0, newVol).toFixed(4)) };
        }
        return p;
      }),
      movements: [newMovement, ...state.movements],
    }));
  },
}));
