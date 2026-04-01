import { useState, useEffect } from 'react';
import { Box, Typography, Chip, List, ListItem, ListItemText, Divider } from '@mui/material';
import { ordersApi } from '../../api/orders';
import { useToast } from '../../contexts/ToastContext';
import type { Order, OrderStatus } from '../../types';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';

const statusLabel: Record<OrderStatus, string> = { pending: '대기중', preparing: '준비중', completed: '완료' };
const statusColor: Record<OrderStatus, 'warning' | 'info' | 'success'> = { pending: 'warning', preparing: 'info', completed: 'success' };

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await ordersApi.getBySession();
        setOrders(res.orders);
      } catch {
        showToast('error', '주문 내역을 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [showToast]);

  if (isLoading) return <LoadingSpinner />;
  if (orders.length === 0) return <EmptyState message="주문 내역이 없습니다" />;

  return (
    <Box p={2}>
      <Typography variant="h6" gutterBottom>주문 내역</Typography>
      <List>
        {orders.map(order => (
          <Box key={order.id} data-testid={`order-history-item-${order.id}`}>
            <ListItem>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2">{order.orderNumber}</Typography>
                    <Chip label={statusLabel[order.status]} color={statusColor[order.status]} size="small" />
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.createdAt).toLocaleString('ko-KR')}
                    </Typography>
                    {order.items.map((item, idx) => (
                      <Typography key={idx} variant="body2">
                        {item.menuName} × {item.quantity} — {item.subtotal.toLocaleString()}원
                      </Typography>
                    ))}
                  </>
                }
              />
              <Typography variant="subtitle1" fontWeight="bold">{order.totalAmount.toLocaleString()}원</Typography>
            </ListItem>
            <Divider />
          </Box>
        ))}
      </List>
    </Box>
  );
}
