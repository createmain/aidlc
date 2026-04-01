import { useState } from 'react';
import { Box, Chip, TextField, IconButton, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { categoriesApi } from '../../../api/categories';
import { useToast } from '../../../contexts/ToastContext';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import type { Category } from '../../../types';

interface Props {
  categories: Category[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onUpdate: () => void;
}

export default function CategoryManager({ categories, selectedId, onSelect, onUpdate }: Props) {
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { showToast } = useToast();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await categoriesApi.create(newName.trim());
      setNewName('');
      onUpdate();
    } catch (err: unknown) {
      showToast('error', (err as { message?: string }).message || '카테고리 등록 실패');
    }
  };

  const handleEdit = async () => {
    if (!editId || !editName.trim()) return;
    try {
      await categoriesApi.update(editId, editName.trim());
      setEditId(null);
      onUpdate();
    } catch (err: unknown) {
      showToast('error', (err as { message?: string }).message || '카테고리 수정 실패');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await categoriesApi.delete(deleteId);
      showToast('success', `카테고리 삭제 (${res.movedMenuCount}개 메뉴 미분류 이동)`);
      setDeleteId(null);
      if (selectedId === deleteId) onSelect(null);
      onUpdate();
    } catch (err: unknown) {
      showToast('error', (err as { message?: string }).message || '카테고리 삭제 실패');
    }
  };

  return (
    <Box>
      <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
        <Chip label="전체" variant={selectedId === null ? 'filled' : 'outlined'} onClick={() => onSelect(null)} data-testid="cat-filter-all" />
        {categories.map(cat => (
          <Box key={cat.id} display="flex" alignItems="center" gap={0.5}>
            {editId === cat.id ? (
              <>
                <TextField size="small" value={editName} onChange={e => setEditName(e.target.value)} sx={{ width: 120 }} data-testid={`cat-edit-input-${cat.id}`} />
                <IconButton size="small" onClick={handleEdit} data-testid={`cat-edit-save-${cat.id}`}><CheckIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => setEditId(null)}><CloseIcon fontSize="small" /></IconButton>
              </>
            ) : (
              <>
                <Chip label={cat.name} variant={selectedId === cat.id ? 'filled' : 'outlined'} onClick={() => onSelect(cat.id)} data-testid={`cat-filter-${cat.id}`} />
                {!cat.isDefault && (
                  <>
                    <IconButton size="small" onClick={() => { setEditId(cat.id); setEditName(cat.name); }} data-testid={`cat-edit-${cat.id}`}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDeleteId(cat.id)} data-testid={`cat-delete-${cat.id}`}><DeleteIcon fontSize="small" /></IconButton>
                  </>
                )}
              </>
            )}
          </Box>
        ))}
      </Box>
      <Box display="flex" gap={1}>
        <TextField size="small" placeholder="새 카테고리명" value={newName} onChange={e => setNewName(e.target.value)} data-testid="cat-new-input" />
        <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={handleCreate} data-testid="cat-new-button">추가</Button>
      </Box>
      <ConfirmDialog open={!!deleteId} title="카테고리 삭제" message="삭제 시 소속 메뉴가 미분류로 이동됩니다" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </Box>
  );
}
