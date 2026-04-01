import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Divider, List, ListItem, ListItemText } from '@mui/material';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { ordersApi } from '../../api/orders';

export default function OrderConfirmPage() {
  const { items, totalAmount } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  if (items.length === 0) {
    navigate('/customer/cart', { replace: true });
    return null;
  }

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await ordersApi.create({
        items: items.map(i => ({ menuItemId: i.menuId, quantity: i.quantity })),
      });
      navigate(`/customer/order/success/${res.orderNumber}`, { replace: true });
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      showToast('error', apiErr.message || '주문 실패. 다시 시도해 주세요');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>주문 확인</Typography>
      <List>
        {items.map(item => (
          <ListItem key={item.menuId} data-testid={`confirm-item-${item.menuId}`}>
            <ListItemText primary={item.menuName} secondary={`${item.quantity}개 × ${item.unitPrice.toLocaleString()}원`} />
            <Typography>{(item.unitPrice * item.quantity).toLocaleString()}원</Typography>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h6">총 금액</Typography>
        <Typography variant="h6" color="primary">{totalAmount.toLocaleString()}원</Typography>
      </Box>
      <Box display="flex" gap={1}>
        <Button fullWidth variant="outlined" onClick={() => navigate(-1)} disabled={isSubmitting} sx={{ minHeight: 48 }}>
          뒤로
        </Button>
        <Button fullWidth variant="contained" onClick={handleConfirm} disabled={isSubmitting} sx={{ minHeight: 48 }} data-testid="order-confirm-button">
          {isSubmitting ? '주문 중...' : '주문 확정'}
        </Button>
      </Box>
    </Box>
  );
}
