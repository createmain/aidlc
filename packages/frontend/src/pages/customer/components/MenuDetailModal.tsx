import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import type { MenuItem } from '../../../types';

const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE_URL || '/uploads';

interface Props {
  menu: MenuItem | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (menuId: number, quantity: number) => void;
}

export default function MenuDetailModal({ menu, open, onClose, onAddToCart }: Props) {
  const [quantity, setQuantity] = useState(1);

  if (!menu) return null;

  const handleAdd = () => {
    onAddToCart(menu.id, quantity);
    setQuantity(1);
  };

  const handleClose = () => {
    setQuantity(1);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth data-testid="menu-detail-modal">
      <DialogTitle>{menu.name}</DialogTitle>
      <DialogContent>
        {menu.imagePath && (
          <Box component="img" src={`${UPLOADS_BASE}/${menu.imagePath}`} alt={menu.name}
            sx={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 1, mb: 2 }} />
        )}
        <Typography variant="h6" color="primary" gutterBottom>{menu.price.toLocaleString()}원</Typography>
        {menu.description && <Typography color="text.secondary">{menu.description}</Typography>}
        <Box display="flex" alignItems="center" justifyContent="center" gap={2} mt={3}>
          <IconButton onClick={() => setQuantity(q => Math.max(1, q - 1))} data-testid="menu-detail-decrease" sx={{ minWidth: 44, minHeight: 44 }}>
            <RemoveIcon />
          </IconButton>
          <Typography variant="h6" data-testid="menu-detail-quantity">{quantity}</Typography>
          <IconButton onClick={() => setQuantity(q => q + 1)} data-testid="menu-detail-increase" sx={{ minWidth: 44, minHeight: 44 }}>
            <AddIcon />
          </IconButton>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>닫기</Button>
        <Button variant="contained" onClick={handleAdd} data-testid="menu-detail-add-to-cart" sx={{ minHeight: 44 }}>
          장바구니 추가 ({(menu.price * quantity).toLocaleString()}원)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
