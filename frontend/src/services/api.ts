export const API_BASE_URL = 'http://localhost:3000/api';
const REQUEST_TIMEOUT_MS = 8000;
import toast from 'react-hot-toast';

function getToken(): string | null {
  return localStorage.getItem('elmahaba_access_token');
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const token = getToken();

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      signal: controller.signal,
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText);
      let parsedError = errorBody;
      try {
        const json = JSON.parse(errorBody);
        parsedError = json.message || json.error || errorBody;
      } catch (e) {}
      throw new Error(parsedError);
    }

    // Handle 204 No Content
    if (response.status === 204) return undefined as T;
    return response.json();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      const msg = `تأخر في الاستجابة (Timeout)`;
      toast.error(msg);
      throw new Error(msg);
    }
    // Show toast for other errors
    const errorMsg = err instanceof Error ? err.message : 'حدث خطأ غير معروف';
    // Don't show toast for auth endpoints to allow local handling
    if (!endpoint.includes('/auth/')) {
      toast.error(`خطأ: ${errorMsg}`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// API Helper Services for Frontend-Backend Synchronization
export const backendApi = {
  request,
  // Auth
  login: (email: string, password: string) =>
    request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request<any>('/auth/me'),

  // Customers & Ledger
  getCustomers: () => request<any[]>('/customers'),
  createCustomer: (data: any) => request<any>('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) => request<any>(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getCustomerLedger: (id: string) => request<any[]>(`/customers/${id}/ledger`),
  addCustomerLedgerEntry: (id: string, entry: any) => request<any>(`/customers/${id}/ledger`, { method: 'POST', body: JSON.stringify(entry) }),

  // Suppliers & Ledger
  getSuppliers: () => request<any[]>('/suppliers'),
  createSupplier: (data: any) => request<any>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id: string, data: any) => request<any>(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSupplierLedger: (id: string) => request<any[]>(`/suppliers/${id}/ledger`),
  addSupplierLedgerEntry: (id: string, entry: any) => request<any>(`/suppliers/${id}/ledger`, { method: 'POST', body: JSON.stringify(entry) }),

  // Wood Products Catalog & Stock
  getWoodProducts: () => request<any[]>('/wood-products'),
  createWoodProduct: (data: any) => request<any>('/wood-products', { method: 'POST', body: JSON.stringify(data) }),
  updateWoodProduct: (id: string, data: any) => request<any>(`/wood-products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWoodProduct: (id: string) => request<void>(`/wood-products/${id}`, { method: 'DELETE' }),
  getInventoryMovements: () => request<any[]>('/wood-products/movements'),

  // Invoices
  getInvoices: () => request<any[]>('/invoices'),
  createInvoice: (data: any) => request<any>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  recordPayment: (invoiceId: string, data: { amount: number; treasuryId: string; createdBy: string; notes?: string }) =>
    request<any>(`/invoices/${invoiceId}/payment`, { method: 'POST', body: JSON.stringify(data) }),
  cancelInvoice: (invoiceId: string, createdBy: string) =>
    request<any>(`/invoices/${invoiceId}/cancel`, { method: 'POST', body: JSON.stringify({ createdBy }) }),
  getNextInvoiceNo: (type: 'sale' | 'purchase') => request<{ invoiceNo: string }>(`/invoices/next-number?type=${type}`),

  // Ledger Entries (all parties)
  getAllLedgerEntries: () => request<any[]>('/ledger'),

  // Treasuries & Transactions
  getTreasuries: () => request<any[]>('/treasuries'),
  getTreasuryTransactions: () => request<any[]>('/treasuries/transactions'),
  updateTreasuryBalance: (id: string, amount: number, type: 'deposit' | 'withdrawal') =>
    request<any>(`/treasuries/${id}/balance`, { method: 'POST', body: JSON.stringify({ amount, type }) }),
  transferFunds: (data: { fromId: string; toId: string; amount: number; notes: string; createdBy: string }) =>
    request<any>('/treasuries/transfer', { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getPnl: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    return request<any>(`/reports/pnl?${params}`);
  },
  getDashboardSummary: () => request<any>('/reports/summary'),

  // Users Management
  getUsers: () => request<any[]>('/users'),
  createUser: (data: any) => request<any>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: any) => request<any>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  setUserActive: (id: string, active: boolean) => request<any>(`/users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ active }) }),
  resetUserPassword: (id: string, password: string) => request<any>(`/users/${id}/reset-password`, { method: 'PATCH', body: JSON.stringify({ password }) }),
  changeMyPassword: (data: any) => request<any>('/users/me/password', { method: 'PATCH', body: JSON.stringify(data) }),
  getAuditLogs: () => request<any[]>('/users/audit-logs'),
  createAuditLog: (data: any) => request<any>('/users/audit-logs', { method: 'POST', body: JSON.stringify(data) }),

  // Backup & Restore
  importDatabase: (data: any) => request<any>('/backup/import', { method: 'POST', body: JSON.stringify(data) }),

  // Reminders (Tazkar)
  getReminders: () => request<any[]>('/reminders'),
  createReminder: (data: { title: string; description?: string; dueDate: string }) => request<any>('/reminders', { method: 'POST', body: JSON.stringify(data) }),
  completeReminder: (id: string) => request<any>(`/reminders/${id}/complete`, { method: 'PATCH' }),
  deleteReminder: (id: string) => request<void>(`/reminders/${id}`, { method: 'DELETE' }),

  // Settings & Notifications
  getSmtpConfig: () => request<any>('/settings/smtp'),
  updateSmtpConfig: (data: any) => request<any>('/settings/smtp', { method: 'POST', body: JSON.stringify(data) }),
  getNotifications: () => request<any[]>('/notifications'),
  markNotificationAsRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PATCH' }),

  // Installments & Alerts
  getInstallments: () => request<any[]>('/installments'),
  createInstallment: (data: any) => request<any>('/installments', { method: 'POST', body: JSON.stringify(data) }),
  toggleInstallmentPaid: (id: string, paid: boolean) => request<any>(`/installments/${id}/toggle-paid`, { method: 'PATCH', body: JSON.stringify({ paid }) }),
  deleteInstallment: (id: string) => request<void>(`/installments/${id}`, { method: 'DELETE' }),

  // Expenses
  getExpenses: () => request<any[]>('/expenses'),
  createExpense: (data: any) => request<any>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  deleteExpense: (id: string) => request<void>(`/expenses/${id}`, { method: 'DELETE' }),
};

