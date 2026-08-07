export type UserRole = 'admin' | 'accountant' | 'storekeeper';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  balance: number; // Positive = client owes us money, Negative = we owe client
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  balance: number; // Positive = we owe supplier, Negative = supplier owes us
  createdAt: string;
}

export interface WoodProduct {
  id: string;
  code: string; // e.g. MTSA-SH 100/19
  name: string; // e.g. خشب سويد فرلندي
  specs: string; // e.g. 100x19 سم
  volumeM3: number; // Cubic meters up to 4 decimals e.g. 8.7951
  pricePerM3: number; // Price per m³
  minStockM3: number;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  date: string;
  invoiceNo: string;
  type: 'in' | 'out'; // in = purchase/incoming, out = sale/issue
  productId: string;
  productName: string;
  productCode: string;
  volumeM3: number;
  pricePerM3: number;
  totalValue: number;
  notes?: string;
  createdBy: string;
}

export type PaymentMethod = 'cash' | 'instapay' | 'bank_transfer' | 'vodafone_cash' | 'check';

export interface Treasury {
  id: string;
  name: string;
  type: PaymentMethod;
  balance: number;
  accountNumber?: string;
}

export interface TreasuryTransaction {
  id: string;
  date: string;
  fromTreasuryId?: string;
  fromTreasuryName?: string;
  toTreasuryId?: string;
  toTreasuryName?: string;
  amount: number;
  type: 'transfer' | 'deposit' | 'withdrawal';
  notes: string;
  createdBy: string;
}

export interface InvoiceItem {
  productId: string;
  productCode: string;
  productName: string;
  volumeM3: number; // 4 decimals
  pricePerM3: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  type: 'sale' | 'purchase';
  partyType: 'customer' | 'supplier';
  partyId: string;
  partyName: string;
  items: InvoiceItem[];
  totalVolumeM3: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentType: 'cash' | 'credit' | 'partial';
  paymentMethod: PaymentMethod;
  treasuryId: string;
  notes?: string; // verbal agreements, delivery terms
  status: 'paid' | 'partial' | 'unpaid' | 'cancelled';
  createdBy: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  partyType: 'customer' | 'supplier';
  partyId: string;
  partyName: string;
  description: string;
  woodSpecs?: string;
  volumeM3?: number;
  pricePerM3?: number;
  debit: number; // مدين (عليه)
  credit: number; // دائن (له)
  balance: number; // الرصيد التراكمي
  invoiceId?: string;
  invoice?: Invoice; // To hold the populated invoice object from backend
  notes?: string;
}

export interface CollectionRouteItem {
  id: string;
  customerId: string;
  customerName: string;
  address: string;
  phone: string;
  dueAmount: number;
  order: number;
  notes?: string;
}

export interface Installment {
  id: string;
  partyName: string;
  partyType: 'supplier' | 'person' | 'general';
  amount: number;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  treasuryId?: string;
  notes?: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userRole: UserRole;
  userName: string;
  action: string;
  details: string;
  ip?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'warning' | 'info' | 'success';
}
