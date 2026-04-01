import { useLocation, useNavigate } from 'react-router-dom';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TableBarIcon from '@mui/icons-material/TableBar';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import HistoryIcon from '@mui/icons-material/History';

const menuItems = [
  { path: '/admin/dashboard', label: '대시보드', icon: <DashboardIcon /> },
  { path: '/admin/tables', label: '테이블 관리', icon: <TableBarIcon /> },
  { path: '/admin/menus', label: '메뉴 관리', icon: <RestaurantMenuIcon /> },
  { path: '/admin/history', label: '과거 내역', icon: <HistoryIcon /> },
];

interface Props { width: number; }

export default function AdminSidebar({ width }: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Drawer variant="permanent" sx={{ width, '& .MuiDrawer-paper': { width, boxSizing: 'border-box' } }}>
      <Toolbar />
      <List>
        {menuItems.map(item => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => navigate(item.path)}
            data-testid={`sidebar-${item.path.split('/').pop()}`}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
