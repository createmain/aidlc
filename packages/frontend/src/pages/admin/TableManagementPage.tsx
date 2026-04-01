import { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { tablesApi } from '../../api/tables';
import { useToast } from '../../contexts/ToastContext';
import type { TableStatus } from '../../types';
import TableList from './components/TableList';
import TableSetupForm from './components/TableSetupForm';
import OrderHistoryModal from './components/OrderHistoryModal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function TableManagementPage() {
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyTableId, setHistoryTableId] = useState<number | null>(null);
  const { showToast } = useToast();

  const loadTables = async () => {
    try {
      const res = await tablesApi.getAll();
      setTables(res.tables);
    } catch {
      showToast('error', '테이블 목록을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadTables(); }, []);

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>테이블 관리</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>테이블 설정</Typography>
        <TableSetupForm onSuccess={loadTables} />
      </Paper>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>테이블 목록</Typography>
        <TableList tables={tables} onHistoryClick={setHistoryTableId} />
      </Paper>
      <OrderHistoryModal tableId={historyTableId} open={!!historyTableId} onClose={() => setHistoryTableId(null)} />
    </Box>
  );
}
