import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.js';
import { DashboardPage } from './pages/dashboard/DashboardPage.js';
import { SubscriptionsPage } from './pages/subscriptions/SubscriptionsPage.js';
import { SubscriptionDetailPage } from './pages/subscriptions/SubscriptionDetailPage.js';
import { InvoicesPage } from './pages/invoices/InvoicesPage.js';
import { InvoiceDetailPage } from './pages/invoices/InvoiceDetailPage.js';
import { PaymentsPage } from './pages/payments/PaymentsPage.js';
import { ProductsPage } from './pages/products/ProductsPage.js';
import { PlansPage } from './pages/plans/PlansPage.js';
import { TaxesDiscountsPage } from './pages/taxes-discounts/TaxesDiscountsPage.js';
import { TemplatesPage } from './pages/templates/TemplatesPage.js';
import { CustomersPage } from './pages/customers/CustomersPage.js';
import { StaffPage } from './pages/staff/StaffPage.js';
import { PortalDashboardPage } from './pages/portal/PortalDashboardPage.js';
import { PortalSettingsPage } from './pages/portal/PortalSettingsPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Checking authentication session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { user, isCustomer } = useAuth();
  if (isCustomer) return <Navigate to="/portal" replace />;
  return <DashboardPage />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Application Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RootRedirect />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="subscriptions/:id" element={<SubscriptionDetailPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="plans" element={<PlansPage />} />
            <Route path="taxes-discounts" element={<TaxesDiscountsPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route
              path="staff"
              element={
                <ProtectedRoute adminOnly>
                  <StaffPage />
                </ProtectedRoute>
              }
            />

            {/* Customer Portal */}
            <Route path="portal" element={<PortalDashboardPage />} />
            <Route path="portal/invoices" element={<PortalDashboardPage />} />
            <Route path="portal/settings" element={<PortalSettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};
