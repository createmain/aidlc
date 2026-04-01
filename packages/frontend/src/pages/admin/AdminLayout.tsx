import { Outlet, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import AdminHeader from './components/AdminHeader';
import AdminSidebar from './components/AdminSidebar';

const SIDEBAR_WIDTH = 220;

export default function AdminLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AdminSidebar width={SIDEBAR_WIDTH} />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AdminHeader />
        <Box component="main" sx={{ flex: 1, p: 3, bgcolor: 'grey.50' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
