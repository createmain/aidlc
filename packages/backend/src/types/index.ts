import { Request } from 'express';

// JWT Payload
export interface AdminTokenPayload {
  adminId: number;
  role: 'admin';
}

export interface TableTokenPayload {
  tableId: number;
  sessionId: number;
  role: 'table';
}

export type TokenPayload = AdminTokenPayload | TableTokenPayload;

// Express Request with user
export interface AuthRequest extends Request {
  user?: TokenPayload;
}

// Domain entities
export interface Settings {
  id: number;
  store_name: string;
  store_identifier: string;
  created_at: Date;
}

export interface AdminUser {
  id: number;
  username: string;
  password_hash: string;
  created_at: Date;
}

export interface Table {
  id: number;
  table_number: number;
  password_hash: string;
  created_at: Date;
}

export interface TableSession {
  id: number;
  table_id: number;
  status: 'active' | 'completed' | 'expired';
  started_at: Date;
  expires_at: Date;
  completed_at: Date | null;
}

export interface Category {
  id: number;
  name: string;
  display_order: number;
  is_default: boolean;
  created_at: Date;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  price: number;
  description: string | null;
  image_path: string | null;
  display_order: number;
  created_at: Date;
  updated_at: Date;
  category_name?: string;
}

export interface Order {
  id: number;
  table_id: number;
  session_id: number;
  order_number: string;
  status: 'pending' | 'preparing' | 'completed';
  total_amount: number;
  is_deleted: boolean;
  is_archived: boolean;
  created_at: Date;
  updated_at: Date;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  menu_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderHistory {
  id: number;
  table_id: number;
  session_id: number;
  order_snapshot: object;
  total_amount: number;
  ordered_at: Date;
  completed_at: Date;
}

export interface LoginAttempt {
  id: number;
  identifier: string;
  attempt_count: number;
  last_attempt_at: Date | null;
  locked_until: Date | null;
}

// API response types
export interface TableStatus {
  tableId: number;
  tableNumber: number;
  sessionStatus: 'active' | 'completed' | 'expired' | null;
  orderCount: number;
  totalAmount: number;
}

// Error class
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details: unknown[] = []
  ) {
    super(message);
    this.name = 'AppError';
  }
}
