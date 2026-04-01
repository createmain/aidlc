import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../../contexts/AuthContext';

export default function AdminHeader() {
  const { logout } = useAuth();

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Typography variant="h6" sx={{ flex: 1 }}>테이블오더 관리</Typography>
        <Button startIcon={<LogoutIcon />} onClick={logout} data-testid="admin-logout-button">
          로그아웃
        </Button>
      </Toolbar>
    </AppBar>
  );
}
