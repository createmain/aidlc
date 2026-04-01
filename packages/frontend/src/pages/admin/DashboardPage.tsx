import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { tablesApi } from '../../api/tables';
import { useToast } from '../../contexts/ToastContext';
import { useSse } from '../../hooks/useSse';
import type { TableStatus, SseNewOrderEvent, SseConnectionStatus } from '../../types';
import TableCard from './components/TableCard';
import OrderDetailPanel from './components/OrderDetailPanel';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const sseStatusConfig: Record<SseConnectionStatus, { color: string; label: string }> = {
  connected: { color: '#4caf50', label: '실시간 연결됨' },
  disconnected: { color: '#f44336', label: '연결 끊김' },
  reconnecting: { color: '#ff9800', label: '재연결 중...' },
};

export default function DashboardPage() {
  const [tables, setTables] = useState<TableStatus[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [highlightedIds, setHighlightedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadTables = useCallback(async () => {
    try {
      const res = await tablesApi.getAll();
      setTables(res.tables);
    } catch {
      showToast('error', '테이블 정보를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => { loadTables(); }, [loadTables]);

  const { status: sseStatus } = useSse({
    onNewOrder: (data) => {
      const event = data as SseNewOrderEvent;
      showToast('info', `테이블 ${event.tableNumber} 새 주문`);
      setHighlightedIds(prev => new Set(prev).add(event.tableId));
      loadTables();
    },
    onOrderStatusChanged: () => { loadTables(); },
    onOrderDeleted: () => { loadTables(); },
    onSessionCompleted: () => { loadTables(); },
    onReconnect: loadTables,
  });

  const handleCardClick = (tableId: number) => {
    setSelectedTableId(tableId);
    setHighlightedIds(prev => {
      const next = new Set(prev);
      next.delete(tableId);
      return next;
    });
  };

  if (isLoading) return <LoadingSpinner fullPage />;

  const sseCfg = sseStatusConfig[sseStatus];

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">주문 대시보드</Typography>
        <Chip
          icon={<FiberManualRecordIcon sx={{ fontSize: 12, color: sseCfg.color }} />}
          label={sseCfg.label}
          size="small"
          variant="outlined"
          data-testid="sse-status-chip"
        />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
        {tables.map(table => (
          <TableCard key={table.id} table={table} isHighlighted={highlightedIds.has(table.id)} onClick={() => handleCardClick(table.id)} />
        ))}
      </Box>
      <OrderDetailPanel tableId={selectedTableId} open={!!selectedTableId} onClose={() => setSelectedTableId(null)} onUpdate={loadTables} />
    </>
  );
}
