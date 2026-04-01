import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useAuth } from '../../../contexts/AuthContext';
import type { SseConnectionStatus } from '../../../types';

const statusConfig: Record<SseConnectionStatus, { color: string; label: string }> = {
  connected: { color: '#4caf50', label: '연결됨' },
  disconnected: { color: '#f44336', label: '연결 끊김' },
  reconnecting: { color: '#ff9800', label: '재연결 중...' },
};

interface Props {
  sseStatus?: SseConnectionStatus;
}

export default function AdminHeader({ sseStatus = 'disconnected' }: Props) {
  const { logout } = useAuth();
  const cfg = statusConfig[sseStatus];

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flex: 1 }}>테이블오더 관리</Typography>
        <Box display="flex" alignItems="center" gap={1} mr={2} data-testid="sse-status-indicator">
          <FiberManualRecordIcon sx={{ fontSize: 12, color: cfg.color }} />
          <Typography variant="caption" color="text.secondary">{cfg.label}</Typography>
        </Box>
        <Button startIcon={<LogoutIcon />} onClick={logout} data-testid="admin-logout-button">
          로그아웃
        </Button>
      </Toolbar>
    </AppBar>
  );
}
