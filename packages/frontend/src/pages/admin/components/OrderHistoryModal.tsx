import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, TextField, Divider } from '@mui/material';
import { tablesApi } from '../../../api/tables';
import { useToast } from '../../../contexts/ToastContext';
import type { OrderHistoryItem } from '../../../types';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import EmptyState from '../../../components/shared/EmptyState';

interface Props {
  tableId: number | null;
  open: boolean;
  onClose: () => void;
}

export default function OrderHistoryModal({ tableId, open, onClose }: Props) {
  const [history, setHistory] = useState<OrderHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (!open || !tableId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await tablesApi.getHistory(tableId, from || undefined, to || undefined);
        setHistory(res.history);
      } catch {
        showToast('error', '과거 내역을 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [open, tableId, from, to, showToast]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth data-testid="order-history-modal">
      <DialogTitle>과거 주문 내역</DialogTitle>
      <DialogContent>
        <Box display="flex" gap={2} mb={2} mt={1}>
          <TextField label="시작일" type="date" value={from} onChange={e => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }} size="small" data-testid="history-from" />
          <TextField label="종료일" type="date" value={to} onChange={e => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }} size="small" data-testid="history-to" />
        </Box>
        {isLoading ? <LoadingSpinner /> : history.length === 0 ? <EmptyState message="과거 내역이 없습니다" /> : (
          history.map(item => (
            <Box key={item.id} mb={2} data-testid={`history-item-${item.id}`}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle2">{item.orderSnapshot.order_number}</Typography>
                <Typography variant="caption" color="text.secondary">
                  완료: {new Date(item.completedAt).toLocaleString('ko-KR')}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                주문: {new Date(item.orderedAt).toLocaleString('ko-KR')}
              </Typography>
              {item.orderSnapshot.items.map((oi, idx) => (
                <Typography key={idx} variant="body2">{oi.menu_name} × {oi.quantity} — {oi.subtotal.toLocaleString()}원</Typography>
              ))}
              <Typography variant="subtitle2">{item.totalAmount.toLocaleString()}원</Typography>
              <Divider sx={{ mt: 1 }} />
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} data-testid="history-close-button">닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
