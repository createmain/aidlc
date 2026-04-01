import { useEffect, useRef, useState, useCallback } from 'react';
import type { SseConnectionStatus } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface UseSseOptions {
  onNewOrder?: (data: unknown) => void;
  onOrderStatusChanged?: (data: unknown) => void;
  onOrderDeleted?: (data: unknown) => void;
  onSessionCompleted?: (data: unknown) => void;
  onReconnect?: () => void;
}

export function useSse(options: UseSseOptions) {
  const [status, setStatus] = useState<SseConnectionStatus>('disconnected');
  const esRef = useRef<EventSource | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) return;

    const es = new EventSource(`${BASE_URL}/realtime/subscribe?token=${encodeURIComponent(token)}`);
    esRef.current = es;

    es.onopen = () => setStatus('connected');

    es.onerror = () => {
      setStatus('reconnecting');
    };

    es.addEventListener('new-order', (e) => {
      optionsRef.current.onNewOrder?.(JSON.parse(e.data));
    });

    es.addEventListener('order-status-changed', (e) => {
      optionsRef.current.onOrderStatusChanged?.(JSON.parse(e.data));
    });

    es.addEventListener('order-deleted', (e) => {
      optionsRef.current.onOrderDeleted?.(JSON.parse(e.data));
    });

    es.addEventListener('session-completed', (e) => {
      optionsRef.current.onSessionCompleted?.(JSON.parse(e.data));
    });
  }, []);

  useEffect(() => {
    connect();
    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [connect]);

  useEffect(() => {
    if (status === 'connected') {
      optionsRef.current.onReconnect?.();
    }
  }, [status]);

  return { status };
}
