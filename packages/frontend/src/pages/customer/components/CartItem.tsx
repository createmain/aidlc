import { Box, Typography, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import type { CartItem as CartItemType } from '../../../types';

interface Props {
  item: CartItemType;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export default function CartItem({ item, onQuantityChange, onRemove }: Props) {
  return (
    <Box display="flex" alignItems="center" py={1.5} gap={1} data-testid={`cart-item-${item.menuId}`}>
      <Box flex={1}>
        <Typography variant="subtitle2">{item.menuName}</Typography>
        <Typography variant="body2" color="text.secondary">{item.unitPrice.toLocaleString()}원</Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={0.5}>
        <IconButton size="small" onClick={() => onQuantityChange(item.quantity - 1)} data-testid={`cart-item-decrease-${item.menuId}`} sx={{ minWidth: 44, minHeight: 44 }}>
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ minWidth: 24, textAlign: 'center' }}>{item.quantity}</Typography>
        <IconButton size="small" onClick={() => onQuantityChange(item.quantity + 1)} data-testid={`cart-item-increase-${item.menuId}`} sx={{ minWidth: 44, minHeight: 44 }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
      <Typography variant="subtitle2" sx={{ minWidth: 70, textAlign: 'right' }}>
        {(item.unitPrice * item.quantity).toLocaleString()}원
      </Typography>
      <IconButton size="small" color="error" onClick={onRemove} data-testid={`cart-item-remove-${item.menuId}`} sx={{ minWidth: 44, minHeight: 44 }}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
