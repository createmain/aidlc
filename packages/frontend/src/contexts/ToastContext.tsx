import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { Snackbar, Alert, type AlertColor } from '@mui/material';

interface Toast {
  id: number;
  type: AlertColor;
  message: string;
}

interface ToastContextValue {
  showToast: (type: AlertColor, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURATION: Record<AlertColor, number> = {
  success: 3000,
  error: 5000,
  warning: 5000,
  info: 4000,
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: AlertColor, message: string) => {
    const id = nextId++;
    setToasts(prev => [...prev.slice(-2), { id, type, message }]);
  }, []);

  const handleClose = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={DURATION[toast.type]}
          onClose={() => handleClose(toast.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ top: `${(index * 60) + 24}px !important` }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.type}
            variant="filled"
            data-testid={`toast-${toast.type}`}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
