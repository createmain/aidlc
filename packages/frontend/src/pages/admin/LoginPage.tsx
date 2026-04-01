import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const [storeIdentifier, setStoreIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/admin/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!storeIdentifier || !username || !password) {
      setError('모든 필드를 입력해 주세요');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(storeIdentifier, username, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: unknown) {
      const apiErr = err as { error?: string; message?: string; retryAfter?: number };
      if (apiErr.error === 'ACCOUNT_LOCKED') {
        setError(`계정 잠금. ${apiErr.retryAfter}분 후 재시도`);
      } else {
        setError(apiErr.message || '인증 실패');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" bgcolor="grey.100">
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" textAlign="center" gutterBottom>관리자 로그인</Typography>
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2} mt={2}>
          <TextField label="매장 식별자" value={storeIdentifier} onChange={e => setStoreIdentifier(e.target.value)}
            fullWidth required data-testid="login-store-identifier" />
          <TextField label="사용자명" value={username} onChange={e => setUsername(e.target.value)}
            fullWidth required data-testid="login-username" />
          <TextField label="비밀번호" type="password" value={password} onChange={e => setPassword(e.target.value)}
            fullWidth required data-testid="login-password" />
          {error && <Typography color="error" variant="body2" data-testid="login-error">{error}</Typography>}
          <Button type="submit" variant="contained" size="large" disabled={isSubmitting} fullWidth
            sx={{ minHeight: 48 }} data-testid="login-submit-button">
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
