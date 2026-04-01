import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from './pages/customer/CustomerLayout';
import MenuPage from './pages/customer/MenuPage';
import CartPage from './pages/customer/CartPage';
import OrderConfirmPage from './pages/customer/OrderConfirmPage';
import OrderSuccessPage from './pages/customer/OrderSuccessPage';
import OrderHistoryPage from './pages/customer/OrderHistoryPage';
import AdminLayout from './pages/admin/AdminLayout';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import TableManagementPage from './pages/admin/TableManagementPage';
import MenuManagementPage from './pages/admin/MenuManagementPage';
import PastOrdersPage from './pages/admin/PastOrdersPage';

export default function App() {
  return (
    <Routes>
      <Route path="/customer/*" element={<CustomerLayout />}>
        <Route index element={<Navigate to="menu" replace />} />
        <Route path="menu" element={<MenuPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="order/confirm" element={<OrderConfirmPage />} />
        <Route path="order/success/:orderNumber" element={<OrderSuccessPage />} />
        <Route path="orders" element={<OrderHistoryPage />} />
      </Route>
      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin/*" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tables" element={<TableManagementPage />} />
        <Route path="menus" element={<MenuManagementPage />} />
        <Route path="history" element={<PastOrdersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/customer/menu" replace />} />
    </Routes>
  );
}
