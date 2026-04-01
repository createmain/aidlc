import { Card, CardActionArea, CardContent, Typography, Chip, Box } from '@mui/material';
import type { TableStatus, SessionStatus } from '../../../types';

const sessionLabel: Record<NonNullable<SessionStatus>, { label: string; color: 'success' | 'default' | 'warning' }> = {
  active: { label: '활성', color: 'success' },
  completed: { label: '완료', color: 'default' },
  expired: { label: '만료', color: 'warning' },
};

interface Props {
  table: TableStatus;
  isHighlighted: boolean;
  onClick: () => void;
}

export default function TableCard({ table, isHighlighted, onClick }: Props) {
  const session = table.sessionStatus ? sessionLabel[table.sessionStatus] : null;

  return (
    <Card
      sx={{
        border: isHighlighted ? 2 : 1,
        borderColor: isHighlighted ? 'warning.main' : 'divider',
        bgcolor: isHighlighted ? 'warning.50' : 'background.paper',
        transition: 'all 0.3s',
      }}
      data-testid={`table-card-${table.id}`}
    >
      <CardActionArea onClick={onClick} sx={{ minHeight: 44 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6">테이블 {table.tableNumber}</Typography>
            {session && <Chip label={session.label} color={session.color} size="small" />}
            {!session && <Chip label="미설정" size="small" variant="outlined" />}
          </Box>
          <Typography variant="body2" color="text.secondary">주문 {table.orderCount}건</Typography>
          <Typography variant="h6" color="primary">{table.totalAmount.toLocaleString()}원</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
