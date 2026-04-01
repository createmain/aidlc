import { apiClient } from './client';
import type { MenuItem } from '../types';

export const menusApi = {
  getAll: (categoryId?: number) => {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return apiClient.get<{ menus: MenuItem[] }>(`/menus${query}`, 'admin');
  },

  getAllForCustomer: (categoryId?: number) => {
    const query = categoryId ? `?categoryId=${categoryId}` : '';
    return apiClient.get<{ menus: MenuItem[] }>(`/menus${query}`, 'table');
  },

  getById: (menuId: number, role: 'admin' | 'table' = 'admin') =>
    apiClient.get<MenuItem>(`/menus/${menuId}`, role),

  create: (formData: FormData) =>
    apiClient.postFormData<MenuItem>('/menus', formData, 'admin'),

  update: (menuId: number, formData: FormData) =>
    apiClient.putFormData<MenuItem>(`/menus/${menuId}`, formData, 'admin'),

  delete: (menuId: number) =>
    apiClient.delete<{ message: string }>(`/menus/${menuId}`, 'admin'),

  updateOrder: (orders: { id: number; displayOrder: number }[]) =>
    apiClient.put<{ message: string }>('/menus/order', { orders }, 'admin'),
};
