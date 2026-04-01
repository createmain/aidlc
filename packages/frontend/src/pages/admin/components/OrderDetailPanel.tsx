import { useState, useEffect, useCallback } from 'react';
import { Drawer, Box, Typography, Button, IconButton, Divider, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { ordersApi } from '../../../api/orders';
import { tablesApi } from '../../../api/tables';
import { useToast } from '../../../contexts/ToastContext';
import type { Order, OrderStatus } from '../../../types';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

const statusLabel: Record<OrderStatus, string> = { pending: '대기중', preparing: '준비중', completed: '완료' };
const statusColor: Record<OrderStatus, 'warning' | 'info' | 'success'> = { pending: 'warning', preparing: 'info', completed: 'success' };

const allowedTransitions: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
  pending: [{ status: 'preparing', label: '준비 시작' }],
  preparing: [{ status: 'completed', label: '준비 완료' }, { status: 'pending', label: '대기로 복귀' }],
  completed: [],
};

interface Props {
  tableId: number | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function OrderDetailPanel({ tableId, open, onClose, onUpdate }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [completeConfirm, setCompleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { showToast } = useToast();

  const loadOrders = useCallback(async () => {
    if (!tableId) return;
    setIsLoading(true);
    try {
      const res = await ordersApi.getByTable(tableId);
      setOrders(res.orders);
    } catch {
      showToast('error', '주문을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [tableId, showToast]);

  useEffect(() => { if (open) loadOrders(); }, [open, loadOrders]);

  const handleStatusChange = async (orderId: number, status: OrderStatus) => {
    try {
      await ordersApi.updateStatus(orderId, status);
      loadOrders();
      onUpdate();
    } catch (err: unknown) {
      showToast('error', (err as { message?: string }).message || '상태 변경 실패');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await ordersApi.delete(deleteTarget);
      showToast('success', '주문이 삭제되었습니다');
      setDeleteTarget(null);
      loadOrders();
      onUpdate();
    } catch (err: unknown) {
      showToast('error', (err as { message?: string }).message || '삭제 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!tableId) return;
    setActionLoading(true);
    try {
      await tablesApi.complete(tableId);
      showToast('success', '이용 완료 처리되었습니다');
      setCompleteConfirm(false);
      onClose();
      onUpdate();
    } catch (err: unknown) {
      showToast('error', (err as { message?: string }).message || '이용 완료 실패');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 420 } }} data-testid="order-detail-panel">
        <Box p={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">주문 상세</Typography>
            <IconButton onClick={onClose} data-testid="order-detail-close"><CloseIcon /></IconButton>
          </Box>
          {isLoading ? <LoadingSpinner /> : (
            <>
              {orders.map(order => (
                <Box key={order.id} mb={2} p={2} border={1} borderColor="divider" borderRadius={1} data-testid={`order-detail-item-${order.id}`}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">{order.orderNumber}</Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Chip label={statusLabel[order.status]} color={statusColor[order.status]} size="small" />
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(order.id)} data-testid={`order-delete-${order.id}`}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="caption" color="text.secondary">{new Date(order.createdAt).toLocaleString('ko-KR')}</Typography>
                  {order.items.map((item, idx) => (
                    <Typography key={idx} variant="body2">{item.menuName} × {item.quantity} — {item.subtotal.toLocaleString()}원</Typography>
                  ))}
                  <Typography variant="subtitle2" mt={1}>{order.totalAmount.toLocaleString()}원</Typography>
                  <Box display="flex" gap={1} mt={1}>
                    {allowedTransitions[order.status].map(t => (
                      <Button key={t.status} size="small" variant="outlined" onClick={() => handleStatusChange(order.id, t.status)}
                        data-testid={`order-status-${order.id}-${t.status}`}>{t.label}</Button>
                    ))}
                  </Box>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Button fullWidth variant="contained" color="warning" onClick={() => setCompleteConfirm(true)} data-testid="table-complete-button">
                이용 완료
              </Button>
            </>
          )}
        </Box>
      </Drawer>
      <ConfirmDialog open={!!deleteTarget} title="주문 삭제" message="이 주문을 삭제하시겠습니까?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} isLoading={actionLoading} />
      <ConfirmDialog open={completeConfirm} title="이용 완료" message="이용을 완료하시겠습니까? 현재 주문이 과거 이력으로 이동됩니다." onConfirm={handleComplete} onCancel={() => setCompleteConfirm(false)} isLoading={actionLoading} />
    </>
  );
}
