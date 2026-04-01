import { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { menusApi } from '../../api/menus';
import { categoriesApi } from '../../api/categories';
import { useToast } from '../../contexts/ToastContext';
import type { MenuItem, Category } from '../../types';
import CategoryManager from './components/CategoryManager';
import MenuList from './components/MenuList';
import MenuForm from './components/MenuForm';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function MenuManagementPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [editMenu, setEditMenu] = useState<MenuItem | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadData = async () => {
    try {
      const [catRes, menuRes] = await Promise.all([
        categoriesApi.getAll('admin'),
        menusApi.getAll(selectedCategoryId ?? undefined),
      ]);
      setCategories(catRes.categories);
      setMenus(menuRes.menus);
    } catch {
      showToast('error', '데이터를 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedCategoryId]);

  const handleOpenCreate = () => { setEditMenu(undefined); setFormOpen(true); };
  const handleOpenEdit = (menu: MenuItem) => { setEditMenu(menu); setFormOpen(true); };

  if (isLoading) return <LoadingSpinner fullPage />;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>메뉴 관리</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <CategoryManager categories={categories} selectedId={selectedCategoryId} onSelect={setSelectedCategoryId} onUpdate={loadData} />
      </Paper>
      <Paper sx={{ p: 3 }}>
        <MenuList menus={menus} onEdit={handleOpenEdit} onCreate={handleOpenCreate} onUpdate={loadData} />
      </Paper>
      <MenuForm menu={editMenu} categories={categories} open={formOpen} onClose={() => setFormOpen(false)} onSave={loadData} />
    </Box>
  );
}
