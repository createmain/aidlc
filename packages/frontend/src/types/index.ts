// === Auth ===
export interface LoginRequest {
  storeIdentifier: string;
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expiresIn: string;
}

export interface TableLoginRequest {
  storeIdentifier: string;
  tableNumber: number;
  password: string;
}

export interface TableLoginResponse {
  token: string;
  expiresIn: number;
  tableId: number;
  sessionId: number;
}

export interface AdminTokenPayload {
  adminId: number;
  role: 'admin';
  exp: number;
}

export interface TableTokenPayload {
  tableId: number;
  sessionId: number;
  role: 'table';
  exp: number;
}

// === Menu / Category ===
export interface Category {
  id: number;
  name: string;
  displayOrder: number;
  isDefault: boolean;
  createdAt?: string;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  price: number;
  description: string | null;
  imagePath: string | null;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

// === Order ===
export type OrderStatus = 'pending' | 'preparing' | 'completed';

export interface OrderItem {
  id: number;
  menuItemId?: number;
  menuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  items: { menuItemId: number; quantity: number }[];
}

export interface CreateOrderResponse {
  id: number;
  orderNumber: string;
  tableId: number;
  sessionId: number;
  status: 'pending';
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
}

export interface UpdateStatusResponse {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  updatedAt: string;
}

export interface DeleteOrderResponse {
  message: string;
  newTableTotal: number;
}

// === Table ===
export type SessionStatus = 'active' | 'completed' | 'expired' | null;

export interface TableStatus {
  id: number;
  tableNumber: number;
  sessionStatus: SessionStatus;
  orderCount: number;
  totalAmount: number;
}

export interface SetupTableRequest {
  tableNumber: number;
  password: string;
}

export interface SetupTableResponse {
  tableId: number;
  tableNumber: number;
  sessionId: number;
  sessionExpiresAt: string;
}

export interface CompleteSessionResponse {
  message: string;
  tableId: number;
  completedAt: string;
}

// === Order History ===
export interface OrderSnapshotItem {
  menu_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface OrderSnapshot {
  order_id: number;
  order_number: string;
  status: string;
  items: OrderSnapshotItem[];
  total_amount: number;
  created_at: string;
}

export interface OrderHistoryItem {
  id: number;
  sessionId: number;
  orderSnapshot: OrderSnapshot;
  totalAmount: number;
  orderedAt: string;
  completedAt: string;
}

// === SSE Events ===
export interface SseNewOrderEvent {
  orderId: number;
  tableId: number;
  tableNumber: number;
  orderNumber: string;
  items: { menuName: string; quantity: number; unitPrice: number; subtotal: number }[];
  totalAmount: number;
}

export interface SseOrderStatusChangedEvent {
  orderId: number;
  tableId: number;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
}

export interface SseOrderDeletedEvent {
  orderId: number;
  tableId: number;
  newTableTotal: number;
}

export interface SseSessionCompletedEvent {
  tableId: number;
  completedAt: string;
}

// === Error ===
export interface ApiError {
  error: string;
  message: string;
  details?: { field: string; message: string }[];
  retryAfter?: number;
}

// === Cart (local) ===
export interface CartItem {
  menuId: number;
  menuName: string;
  unitPrice: number;
  quantity: number;
}

// === SSE Connection ===
export type SseConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
