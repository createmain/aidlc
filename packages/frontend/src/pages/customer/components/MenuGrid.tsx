import { Box } from '@mui/material';
import type { MenuItem } from '../../../types';
import MenuCard from './MenuCard';
import EmptyState from '../../../components/shared/EmptyState';

interface Props {
  menus: MenuItem[];
  onMenuClick: (menu: MenuItem) => void;
}

export default function MenuGrid({ menus, onMenuClick }: Props) {
  if (menus.length === 0) return <EmptyState message="메뉴가 없습니다" />;

  return (
    <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 2, alignContent: 'start' }}>
      {menus.map(menu => (
        <MenuCard key={menu.id} menu={menu} onClick={() => onMenuClick(menu)} />
      ))}
    </Box>
  );
}
