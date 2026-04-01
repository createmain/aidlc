import type { ApiError } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  private getToken(role: 'admin' | 'table'): string | null {
    return localStorage.getItem(role === 'admin' ? 'admin_token' : 'table_token');
  }

  private buildHeaders(role?: 'admin' | 'table', isFormData = false): HeadersInit {
    const headers: Record<string, string> = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (role) {
      const token = this.getToken(role);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        error: 'UNKNOWN_ERROR',
        message: '알 수 없는 오류가 발생했습니다',
      }));
      if (response.status === 401) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('table_token');
      }
      throw { status: response.status, ...error };
    }
    return response.json();
  }

  async get<T>(path: string, role?: 'admin' | 'table'): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: this.buildHeaders(role),
    });
    return this.handleResponse<T>(res);
  }

  async post<T>(path: string, body?: unknown, role?: 'admin' | 'table'): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: this.buildHeaders(role),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async postFormData<T>(path: string, formData: FormData, role?: 'admin' | 'table'): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: this.buildHeaders(role, true),
      body: formData,
    });
    return this.handleResponse<T>(res);
  }

  async put<T>(path: string, body?: unknown, role?: 'admin' | 'table'): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: this.buildHeaders(role),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async putFormData<T>(path: string, formData: FormData, role?: 'admin' | 'table'): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: this.buildHeaders(role, true),
      body: formData,
    });
    return this.handleResponse<T>(res);
  }

  async patch<T>(path: string, body?: unknown, role?: 'admin' | 'table'): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: this.buildHeaders(role),
      body: body ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse<T>(res);
  }

  async delete<T>(path: string, role?: 'admin' | 'table'): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: this.buildHeaders(role),
    });
    return this.handleResponse<T>(res);
  }
}

export const apiClient = new ApiClient();
