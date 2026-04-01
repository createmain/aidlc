import { apiClient } from './client';
import type {
  TableStatus, SetupTableRequest, SetupTableResponse,
  CompleteSessionResponse, OrderHistoryItem,
} from '../types';

export const tablesApi = {
  getAll: () =>
    apiClient.get<{ tables: TableStatus[] }>('/tables', 'admin'),

  setup: (data: SetupTableRequest) =>
    apiClient.post<SetupTableResponse>('/tables/setup', data, 'admin'),

  complete: (tableId: number) =>
    apiClient.post<CompleteSessionResponse>(`/tables/${tableId}/complete`, undefined, 'admin'),

  getHistory: (tableId: number, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<{ history: OrderHistoryItem[] }>(`/tables/${tableId}/history${query}`, 'admin');
  },

  getStatus: (tableId: number) =>
    apiClient.get<TableStatus>(`/tables/${tableId}/status`, 'admin'),
};
