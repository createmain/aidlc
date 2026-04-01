import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';

interface TableAuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  tableId: number | null;
  sessionId: number | null;
  error: string | null;
  isLoading: boolean;
}

const TableAuthContext = createContext<TableAuthContextValue | null>(null);

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function TableAuthProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [tableId, setTableId] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const store = searchParams.get('store');
      const table = searchParams.get('table');
      const password = searchParams.get('password');

      if (store && table && password) {
        try {
          const res = await authApi.tableLogin({
            storeIdentifier: store,
            tableNumber: parseInt(table, 10),
            password,
          });
          localStorage.setItem('table_token', res.token);
          localStorage.setItem('table_id', String(res.tableId));
          localStorage.setItem('session_id', String(res.sessionId));
          setToken(res.token);
          setTableId(res.tableId);
          setSessionId(res.sessionId);
          setIsLoading(false);
          return;
        } catch (err: unknown) {
          const apiErr = err as { message?: string };
          setError(apiErr.message || '로그인 실패');
          setIsLoading(false);
          return;
        }
      }

      const stored = localStorage.getItem('table_token');
      if (stored && !isTokenExpired(stored)) {
        setToken(stored);
        setTableId(Number(localStorage.getItem('table_id')));
        setSessionId(Number(localStorage.getItem('session_id')));
      } else {
        localStorage.removeItem('table_token');
        localStorage.removeItem('table_id');
        localStorage.removeItem('session_id');
        setError('세션 만료. 관리자에게 문의하세요');
      }
      setIsLoading(false);
    };
    init();
  }, [searchParams]);

  return (
    <TableAuthContext.Provider value={{ token, isAuthenticated: !!token, tableId, sessionId, error, isLoading }}>
      {children}
    </TableAuthContext.Provider>
  );
}

export function useTableAuth() {
  const ctx = useContext(TableAuthContext);
  if (!ctx) throw new Error('useTableAuth must be used within TableAuthProvider');
  return ctx;
}
