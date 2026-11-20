import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../hooks/useAuth.js';
import ForbiddenPage from '../pages/ForbiddenPage.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';
import SetupPage from '../pages/SetupPage.jsx';
import DashboardPage from '../pages/admin/DashboardPage.jsx';
import OrderDetailPage from '../pages/admin/OrderDetailPage.jsx';
import OrdersPage from '../pages/admin/OrdersPage.jsx';
import ProductsPage from '../pages/admin/ProductsPage.jsx';
import RawMaterialsPage from '../pages/admin/RawMaterialsPage.jsx';
import MyOrdersPage from '../pages/operator/MyOrdersPage.jsx';
import OperatorOrderDetailPage from '../pages/operator/OperatorOrderDetailPage.jsx';
import OrderHistoryPage from '../pages/operator/OrderHistoryPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import RoleRoute from './RoleRoute.jsx';

function RootRedirect() {
  const { isLoading, isInstalled, isAuthenticated, role } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        <p>Chargement...</p>
      </div>
    );
  }

  if (isInstalled === false) {
    return <Navigate to="/setup" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={role?.toUpperCase() === 'ADMIN' ? '/admin/dashboard' : '/operator/orders'}
      replace
    />
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirection intelligente racine */}
        <Route path="/" element={<RootRedirect />} />

        {/* Routes publiques */}
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />

        {/* Routes authentifiées avec layout partagé */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Espace Administrateur */}
            <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/raw-materials" element={<RawMaterialsPage />} />
              <Route path="/admin/products" element={<ProductsPage />} />
              <Route path="/admin/orders" element={<OrdersPage />} />
              <Route path="/admin/orders/:id" element={<OrderDetailPage />} />
            </Route>

            {/* Espace Opérateur */}
            <Route element={<RoleRoute allowedRoles={['OPERATOR']} />}>
              <Route path="/operator" element={<Navigate to="/operator/orders" replace />} />
              <Route path="/operator/orders" element={<MyOrdersPage />} />
              <Route path="/operator/orders/:id" element={<OperatorOrderDetailPage />} />
              <Route path="/operator/history" element={<OrderHistoryPage />} />
            </Route>
          </Route>
        </Route>

        {/* Page 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}