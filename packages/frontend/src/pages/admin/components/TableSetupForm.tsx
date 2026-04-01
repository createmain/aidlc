import { useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { tablesApi } from '../../../api/tables';
import { useToast } from '../../../contexts/ToastContext';

interface Props { onSuccess: () => void; }

export default function TableSetupForm({ onSuccess }: Props) {
  const [tableNumber, setTableNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showToast } = useToast();

  const validate = () => {
    const e: Record<string, string> = {};
    const num = parseInt(tableNumber, 10);
    if (!tableNumber || isNaN(num) || num <= 0) e.tableNumber = '1 이상의 정수를 입력해 주세요';
    if (!password) e.password = '비밀번호를 입력해 주세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await tablesApi.setup({ tableNumber: parseInt(tableNumber, 10), password });
      showToast('success', '테이블 설정 완료');
      setTableNumber('');
      setPassword('');
      onSuccess();
    } catch (err: unknown) {
      showToast('error', (err as { message?: string }).message || '설정 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} display="flex" gap={2} alignItems="flex-start">
      <TextField label="테이블 번호" type="number" value={tableNumber} onChange={e => setTableNumber(e.target.value)}
        error={!!errors.tableNumber} helperText={errors.tableNumber} size="small" data-testid="table-setup-number" />
      <TextField label="비밀번호" type="password" value={password} onChange={e => setPassword(e.target.value)}
        error={!!errors.password} helperText={errors.password} size="small" data-testid="table-setup-password" />
      <Button type="submit" variant="contained" disabled={isSubmitting} data-testid="table-setup-submit">
        {isSubmitting ? '설정 중...' : '설정'}
      </Button>
    </Box>
  );
}
