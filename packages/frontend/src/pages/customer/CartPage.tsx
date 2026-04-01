import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Divider } from '@mui/material';
import { useCart } from '../../contexts/CartContext';
import CartItem from './components/CartItem';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import EmptyState from '../../components/shared/EmptyState';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clear, totalAmount } = useCart();
  const [clearConfirm, setClearConfirm] = useState(false);
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <Box p={3}>
        <EmptyState message="장바구니가 비어있습니다" />
        <Box textAlign="center" mt={2}>
          <Button variant="outlined" onClick={() => navigate('/customer/menu')} data-testid="cart-go-menu">메뉴로 돌아가기</Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">장바구니</Typography>
        <Button color="error" size="small" onClick={() => setClearConfirm(true)} data-testid="cart-clear-button">전체 비우기</Button>
      </Box>
      {items.map(item => (
        <CartItem key={item.menuId} item={item} onQuantityChange={qty => updateQuantity(item.menuId, qty)} onRemove={() => removeItem(item.menuId)} />
      ))}
      <Divider sx={{ my: 2 }} />
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h6">총 금액</Typography>
        <Typography variant="h6" color="primary">{totalAmount.toLocaleString()}원</Typography>
      </Box>
      <Button fullWidth variant="contained" size="large" onClick={() => navigate('/customer/order/confirm')} sx={{ minHeight: 48 }} data-testid="cart-order-button">
        주문하기
      </Button>
      <ConfirmDialog open={clearConfirm} title="장바구니 비우기" message="장바구니를 비우시겠습니까?" onConfirm={() => { clear(); setClearConfirm(false); }} onCancel={() => setClearConfirm(false)} />
    </Box>
  );
}
