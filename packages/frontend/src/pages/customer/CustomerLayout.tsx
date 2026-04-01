import { Outlet } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { TableAuthProvider, useTableAuth } from '../../contexts/TableAuthContext';
import { CartProvider } from '../../contexts/CartContext';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

function CustomerContent() {
  const { isAuthenticated, error, isLoading } = useTableAuth();

  if (isLoading) return <LoadingSpinner fullPage />;

  if (!isAuthenticated) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" p={3}>
        <Typography variant="h5" color="error" gutterBottom>인증 오류</Typography>
        <Typography color="text.secondary">{error || '관리자 재설정이 필요합니다'}</Typography>
      </Box>
    );
  }

  return (
    <CartProvider>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Box sx={{ flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </CartProvider>
  );
}

export default function CustomerLayout() {
  return (
    <TableAuthProvider>
      <CustomerContent />
    </TableAuthProvider>
  );
}
