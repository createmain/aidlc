import { apiClient } from './client';
import type {
  CreateOrderRequest, CreateOrderResponse, Order,
  UpdateStatusResponse, DeleteOrderResponse, OrderStatus,
} from '../types';

export const ordersApi = {
  create: (data: CreateOrderRequest) =>
    apiClient.post<CreateOrderResponse>('/orders', data, 'table'),

  getBySession: () =>
    apiClient.get<{ orders: Order[] }>('/orders', 'table'),

  getByTable: (tableId: number) =>
    apiClient.get<{ orders: Order[] }>(`/orders?tableId=${tableId}`, 'admin'),

  updateStatus: (orderId: number, status: OrderStatus) =>
    apiClient.patch<UpdateStatusResponse>(`/orders/${orderId}/status`, { status }, 'admin'),

  delete: (orderId: number) =>
    apiClient.delete<DeleteOrderResponse>(`/orders/${orderId}`, 'admin'),
};
