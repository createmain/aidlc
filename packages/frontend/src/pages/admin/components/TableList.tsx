import { Table, TableHead, TableRow, TableCell, TableBody, Chip, Button } from '@mui/material';
import type { TableStatus, SessionStatus } from '../../../types';

const sessionLabel: Record<NonNullable<SessionStatus>, { label: string; color: 'success' | 'default' | 'warning' }> = {
  active: { label: '활성', color: 'success' },
  completed: { label: '완료', color: 'default' },
  expired: { label: '만료', color: 'warning' },
};

interface Props {
  tables: TableStatus[];
  onHistoryClick: (tableId: number) => void;
}

export default function TableList({ tables, onHistoryClick }: Props) {
  return (
    <Table data-testid="table-list">
      <TableHead>
        <TableRow>
          <TableCell>번호</TableCell>
          <TableCell>세션 상태</TableCell>
          <TableCell>주문 건수</TableCell>
          <TableCell>총 주문액</TableCell>
          <TableCell></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tables.map(t => {
          const session = t.sessionStatus ? sessionLabel[t.sessionStatus] : null;
          return (
            <TableRow key={t.id} data-testid={`table-row-${t.id}`}>
              <TableCell>테이블 {t.tableNumber}</TableCell>
              <TableCell>{session ? <Chip label={session.label} color={session.color} size="small" /> : <Chip label="미설정" size="small" variant="outlined" />}</TableCell>
              <TableCell>{t.orderCount}건</TableCell>
              <TableCell>{t.totalAmount.toLocaleString()}원</TableCell>
              <TableCell>
                <Button size="small" onClick={() => onHistoryClick(t.id)} data-testid={`table-history-${t.id}`}>과거 내역</Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
