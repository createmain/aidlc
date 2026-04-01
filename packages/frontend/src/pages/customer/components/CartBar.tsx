import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

interface Props {
  itemCount: number;
  totalAmount: number;
}

export default function CartBar({ itemCount, totalAmount }: Props) {
  const navigate = useNavigate();
  const disabled = itemCount === 0;

  return (
    <Box sx={{ p: 1.5, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Button
        fullWidth
        variant="contained"
        size="large"
        disabled={disabled}
        startIcon={<ShoppingCartIcon />}
        onClick={() => navigate('/customer/cart')}
        sx={{ minHeight: 48, justifyContent: 'space-between', px: 3 }}
        data-testid="cart-bar-button"
      >
        <Typography>{itemCount}개 항목</Typography>
        <Typography fontWeight="bold">{totalAmount.toLocaleString()}원</Typography>
      </Button>
    </Box>
  );
}
