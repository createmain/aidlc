import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { categoriesApi } from '../../api/categories';
import { menusApi } from '../../api/menus';
import type { Category, MenuItem } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { useCart } from '../../contexts/CartContext';
import CategorySidebar from './components/CategorySidebar';
import MenuGrid from './components/MenuGrid';
import MenuDetailModal from './components/MenuDetailModal';
import CartBar from './components/CartBar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const { addItem, totalAmount, itemCount } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, menuRes] = await Promise.all([
          categoriesApi.getAll('table'),
          menusApi.getAllForCustomer(selectedCategoryId ?? undefined),
        ]);
        setCategories(catRes.categories);
        setMenus(menuRes.menus);
      } catch {
        showToast('error', '데이터를 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [selectedCategoryId, showToast]);

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <Box sx={{ display: 'flex', height: '100vh', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <CategorySidebar categories={categories} selectedId={selectedCategoryId} onSelect={setSelectedCategoryId} />
        <MenuGrid menus={menus} onMenuClick={setSelectedMenu} />
      </Box>
      <CartBar itemCount={itemCount} totalAmount={totalAmount} />
      <MenuDetailModal
        menu={selectedMenu}
        open={!!selectedMenu}
        onClose={() => setSelectedMenu(null)}
        onAddToCart={(menuId, qty) => {
          const menu = menus.find(m => m.id === menuId);
          if (menu) addItem(menu, qty);
          setSelectedMenu(null);
        }}
      />
    </Box>
  );
}
