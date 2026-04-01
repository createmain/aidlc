import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem as MuiMenuItem, Box } from '@mui/material';
import { menusApi } from '../../../api/menus';
import { useToast } from '../../../contexts/ToastContext';
import type { MenuItem, Category } from '../../../types';

const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE_URL || '/uploads';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

interface Props {
  menu?: MenuItem;
  categories: Category[];
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function MenuForm({ menu, categories, open, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const isEdit = !!menu;

  useEffect(() => {
    if (open && menu) {
      setName(menu.name);
      setPrice(String(menu.price));
      setDescription(menu.description || '');
      setCategoryId(String(menu.categoryId));
      setImagePreview(menu.imagePath ? `${UPLOADS_BASE}/${menu.imagePath}` : null);
    } else if (open) {
      setName(''); setPrice(''); setDescription(''); setCategoryId('');
      setImageFile(null); setImagePreview(null);
    }
    setErrors({});
  }, [open, menu]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.length > 100) e.name = '메뉴명을 입력해 주세요 (1~100자)';
    const p = parseInt(price, 10);
    if (isNaN(p) || p < 0) e.price = '0 이상의 정수를 입력해 주세요';
    if (!categoryId) e.categoryId = '카테고리를 선택해 주세요';
    if (imageFile) {
      if (!ALLOWED_TYPES.includes(imageFile.type)) e.image = '지원하지 않는 이미지 형식입니다';
      if (imageFile.size > MAX_SIZE) e.image = '이미지 크기는 5MB 이하여야 합니다';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('price', price);
    if (description) formData.append('description', description);
    formData.append('categoryId', categoryId);
    if (imageFile) formData.append('image', imageFile);

    try {
      if (isEdit && menu) {
        await menusApi.update(menu.id, formData);
        showToast('success', '메뉴가 수정되었습니다');
      } else {
        await menusApi.create(formData);
        showToast('success', '메뉴가 등록되었습니다');
      }
      onClose();
      onSave();
    } catch (err: unknown) {
      showToast('error', (err as { message?: string }).message || '저장 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth data-testid="menu-form-dialog">
      <DialogTitle>{isEdit ? '메뉴 수정' : '메뉴 등록'}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <TextField label="메뉴명" value={name} onChange={e => setName(e.target.value)} error={!!errors.name} helperText={errors.name} required data-testid="menu-form-name" />
          <TextField label="가격" type="number" value={price} onChange={e => setPrice(e.target.value)} error={!!errors.price} helperText={errors.price} required data-testid="menu-form-price" />
          <TextField label="설명" value={description} onChange={e => setDescription(e.target.value)} multiline rows={2} data-testid="menu-form-description" />
          <TextField label="카테고리" select value={categoryId} onChange={e => setCategoryId(e.target.value)} error={!!errors.categoryId} helperText={errors.categoryId} required data-testid="menu-form-category">
            {categories.map(cat => <MuiMenuItem key={cat.id} value={String(cat.id)}>{cat.name}</MuiMenuItem>)}
          </TextField>
          <Button variant="outlined" component="label" data-testid="menu-form-image-upload">
            이미지 선택
            <input type="file" hidden accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageChange} />
          </Button>
          {errors.image && <Box color="error.main" fontSize={12}>{errors.image}</Box>}
          {imagePreview && <Box component="img" src={imagePreview} alt="미리보기" sx={{ maxHeight: 200, objectFit: 'contain', borderRadius: 1 }} />}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>취소</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting} data-testid="menu-form-submit">
          {isSubmitting ? '저장 중...' : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
