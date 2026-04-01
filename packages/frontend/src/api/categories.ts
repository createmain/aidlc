import { apiClient } from './client';
import type { Category } from '../types';

export const categoriesApi = {
  getAll: (role: 'admin' | 'table' = 'admin') =>
    apiClient.get<{ categories: Category[] }>('/categories', role),

  create: (name: string) =>
    apiClient.post<Category>('/categories', { name }, 'admin'),

  update: (categoryId: number, name: string) =>
    apiClient.put<Category>(`/categories/${categoryId}`, { name }, 'admin'),

  delete: (categoryId: number) =>
    apiClient.delete<{ message: string; movedMenuCount: number }>(`/categories/${categoryId}`, 'admin'),

  updateOrder: (orders: { id: number; displayOrder: number }[]) =>
    apiClient.put<{ message: string }>('/categories/order', { orders }, 'admin'),
};
