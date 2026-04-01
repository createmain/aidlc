import { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { tablesApi } from '../../api/tables';
import { useToast } from '../../contexts/ToastContext';
import type { TableStatus } from '../../types';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import OrderHistoryModal from './components/OrderHistoryModal';

export default function PastOrdersPage() {
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await tablesApi.getAll();
        setTables(res.tables);
      } catch {
        showToast('error', '테이블 목록을 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [showToast]);

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>과거 주문 내역</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>테이블을 선택하여 과거 주문 내역을 조회하세요</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mt: 2 }}>
        {tables.map(t => (
          <Paper key={t.id} sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
            onClick={() => setSelectedTableId(t.id)} data-testid={`past-orders-table-${t.id}`}>
            <Typography variant="subtitle1">테이블 {t.tableNumber}</Typography>
          </Paper>
        ))}
      </Box>
      <OrderHistoryModal tableId={selectedTableId} open={!!selectedTableId} onClose={() => setSelectedTableId(null)} />
    </Box>
  );
}
