import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

interface Props {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, isLoading = false }: Props) {
  return (
    <Dialog open={open} onClose={onCancel} data-testid="confirm-dialog">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={isLoading} data-testid="confirm-dialog-cancel">
          취소
        </Button>
        <Button onClick={onConfirm} variant="contained" color="primary" disabled={isLoading} data-testid="confirm-dialog-confirm">
          {isLoading ? '처리 중...' : '확인'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
