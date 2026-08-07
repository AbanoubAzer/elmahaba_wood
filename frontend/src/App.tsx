import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/catalog/Products';
import { Inventory } from './pages/inventory/Inventory';
import { Customers } from './pages/customers/Customers';
import { CustomerStatement } from './pages/customers/CustomerStatement';
import { Suppliers } from './pages/suppliers/Suppliers';
import { SupplierStatement } from './pages/suppliers/SupplierStatement';
import { InvoicesList } from './pages/invoices/InvoicesList';
import { NewInvoice } from './pages/invoices/NewInvoice';
import { TreasuryAccounts } from './pages/treasury/TreasuryAccounts';
import { Checks } from './pages/treasury/Checks';
import { Ledger } from './pages/ledger/Ledger';
import { CollectionRoute } from './pages/reports/CollectionRoute';
import { InstallmentPlans } from './pages/installments/InstallmentPlans';
import { AuditLogs } from './pages/admin/AuditLogs';
import { UserManagement } from './pages/admin/UserManagement';
import { DatabaseBackup } from './pages/admin/DatabaseBackup';
import { NotificationCenter } from './pages/notifications/NotificationCenter';
import { ExpensesPage } from './pages/expenses/ExpensesPage';
import { ProfitLoss } from './pages/reports/ProfitLoss';
import { CashFlow } from './pages/reports/CashFlow';
import { LoginPage } from './pages/auth/LoginPage';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { useAuthStore } from './store/authStore';
import { useCustomerSupplierStore } from './store/customerSupplierStore';
import { useWoodStore } from './store/woodStore';
import { useTreasuryStore } from './store/treasuryStore';
import { useInvoiceStore } from './store/invoiceStore';
import { useNotificationStore } from './store/notificationStore';
import { useInstallmentStore } from './store/installmentStore';
import { useExpenseStore } from './store/expenseStore';
import { useReminderStore } from './store/reminderStore';
import { useCheckStore } from './store/checkStore';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { restoreSession } from './store/authStore';

export function App() {
  const { isAuthenticated } = useAuthStore();
  const [isAppReady, setIsAppReady] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  // Restore session from stored token on initial page load
  useEffect(() => {
    restoreSession().finally(() => setIsRestoringSession(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const loadAllData = async () => {
        try {
          const user = useAuthStore.getState().currentUser;
          const isAdmin = user?.role === 'admin';

          // Core stores — accessible to all authenticated users
          const coreStores = [
            useCustomerSupplierStore.getState().loadFromBackend(),
            useWoodStore.getState().loadFromBackend(),
            useTreasuryStore.getState().loadFromBackend(),
            useInvoiceStore.getState().loadFromBackend(),
            useReminderStore.getState().loadReminders(),
            useExpenseStore.getState().loadFromBackend(),
          ];

          // Admin-only stores — would return 403 for accountant/storekeeper
          if (isAdmin) {
            coreStores.push(
              useCheckStore.getState().loadChecks(),
              useNotificationStore.getState().loadFromBackend(),
              useInstallmentStore.getState().loadFromBackend(),
            );
          }

          await Promise.all(coreStores);
        } catch (error) {
          console.warn('[App Init] Some stores failed to load from backend:', error);
        } finally {
          setIsAppReady(true);
        }
      };
      loadAllData();
    } else {
      setIsAppReady(true); // If not authenticated, we are ready to show login
    }
  }, [isAuthenticated]);

  if (isRestoringSession || (!isAuthenticated && !isAppReady)) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-[#f28913] animate-spin" />
        <h2 className="text-xl font-bold text-slate-700">جاري تحميل بيانات النظام...</h2>
        <p className="text-slate-400 text-sm">المحبة لتجارة الأخشاب</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <OfflineBanner />
        <LoginPage />
      </>
    );
  }

  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-[#f28913] animate-spin" />
        <h2 className="text-xl font-bold text-slate-700">جاري تحميل بيانات النظام...</h2>
        <p className="text-slate-400 text-sm">المحبة لتجارة الأخشاب</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <OfflineBanner />
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="catalog" element={<Products />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerStatement />} />
          <Route path="customers/:id/statement" element={<CustomerStatement />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="suppliers/:id" element={<SupplierStatement />} />
          <Route path="suppliers/:id/statement" element={<SupplierStatement />} />
          <Route path="invoices" element={<InvoicesList />} />
          <Route path="invoices/new" element={<NewInvoice />} />
          <Route path="treasury" element={<TreasuryAccounts />} />
          <Route path="checks" element={<Checks />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="collection-route" element={<CollectionRoute />} />
          <Route path="installments" element={<InstallmentPlans />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="reports" element={<ProfitLoss />} />
          <Route path="reports/pnl" element={<ProfitLoss />} />
          <Route path="reports/cash-flow" element={<CashFlow />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="backup" element={<DatabaseBackup />} />
          <Route path="notifications" element={<NotificationCenter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
