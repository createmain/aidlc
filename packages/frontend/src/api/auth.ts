import { apiClient } from './client';
import type { LoginRequest, LoginResponse, TableLoginRequest, TableLoginResponse } from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login', data),

  tableLogin: (data: TableLoginRequest) =>
    apiClient.post<TableLoginResponse>('/auth/table-login', data),
};
