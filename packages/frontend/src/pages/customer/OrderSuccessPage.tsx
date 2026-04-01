import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useCart } from '../../contexts/CartContext';

export default function OrderSuccessPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const navigate = useNavigate();
  const { clear } = useCart();
  const [countdown, setCountdown] = useState(5);
  const [cancelled, setCancelled] = useState(false);
  const clearedRef = useRef(false);

  useEffect(() => {
    if (!clearedRef.current) {
      clear();
      clearedRef.current = true;
    }
  }, [clear]);

  useEffect(() => {
    if (cancelled) return;
    if (countdown <= 0) {
      navigate('/customer/menu', { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, cancelled, navigate]);

  const handleInteraction = () => {
    if (!cancelled) setCancelled(true);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="80vh" p={3}
      onClick={handleInteraction} onTouchStart={handleInteraction}>
      <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>주문 완료</Typography>
      <Typography variant="h4" color="primary" fontWeight="bold" gutterBottom data-testid="order-success-number">
        {orderNumber}
      </Typography>
      {!cancelled && (
        <Typography color="text.secondary" data-testid="order-success-countdown">
          {countdown}초 후 메뉴 화면으로 이동합니다
        </Typography>
      )}
      {cancelled && (
        <Typography color="text.secondary">자동 이동이 취소되었습니다</Typography>
      )}
      <Button variant="outlined" sx={{ mt: 3, minHeight: 44 }} onClick={() => navigate('/customer/menu', { replace: true })} data-testid="order-success-go-menu">
        메뉴로 돌아가기
      </Button>
    </Box>
  );
}
