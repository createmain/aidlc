# Frontend - 도메인 엔티티 (데이터 모델)

> 모든 API 응답/요청 타입은 `api-specification.md` 기준

---

## 1. API 응답 타입

### 1.1 인증

```typescript
// POST /api/auth/login — 200
interface LoginResponse {
  token: string;
  expiresIn: string;       // "16h"
}

// POST /api/auth/table-login — 200
interface TableLoginResponse {
  token: string;
  expiresIn: number;       // 세션 남은 시간 (초)
  tableId: number;
  sessionId: number;
}

// JWT 디코딩 페이로드 (관리자)
interface AdminTokenPayload {
  adminId: number;
  storeId: number;
  role: 'admin';
  exp: number;
}

// JWT 디코딩 페이로드 (테이블)
interface TableTokenPayload {
  tableId: number;
  storeId: number;
  sessionId: number;
  role: 'table';
  exp: number;
}
```

### 1.2 메뉴/카테고리

```typescript
interface Category {
  id: number;
  name: string;
  displayOrder: number;
  isDefault: boolean;
  createdAt?: string;      // 등록/수정 응답에만 포함
}

interface MenuItem {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  price: number;           // 원 단위 정수
  description: string | null;
  imagePath: string | null;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}
```

### 1.3 주문

```typescript
type OrderStatus = 'pending' | 'preparing' | 'completed';

interface OrderItem {
  id: number;
  menuItemId?: number;     // 생성 응답에만 포함
  menuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

// POST /api/orders — 201
interface CreateOrderResponse {
  id: number;
  orderNumber: string;
  tableId: number;
  sessionId: number;
  status: 'pending';
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
}

// GET /api/orders — 200
interface OrderListResponse {
  orders: Order[];
}

interface Order {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

// PATCH /api/orders/:orderId/status — 200
interface UpdateStatusResponse {
  id: number;
  orderNumber: string;
  status: OrderStatus;
  updatedAt: string;
}

// DELETE /api/orders/:orderId — 200
interface DeleteOrderResponse {
  message: string;
  newTableTotal: number;
}
```

### 1.4 테이블/세션

```typescript
// GET /api/tables — 200
interface TableListResponse {
  tables: TableStatus[];
}

interface TableStatus {
  id: number;
  tableNumber: number;
  sessionStatus: 'active' | 'completed' | 'expired' | null;
  orderCount: number;
  totalAmount: number;
}

// POST /api/tables/setup — 201
interface SetupTableResponse {
  tableId: number;
  tableNumber: number;
  sessionId: number;
  sessionExpiresAt: string;
}

// POST /api/tables/:tableId/complete — 200
interface CompleteSessionResponse {
  message: string;
  tableId: number;
  completedAt: string;
}

// GET /api/tables/:tableId/status — 200
interface TableDetailStatus {
  tableId: number;
  tableNumber: number;
  sessionStatus: 'active' | 'completed' | 'expired' | null;
  orderCount: number;
  totalAmount: number;
}
```

### 1.5 주문 이력

```typescript
// GET /api/tables/:tableId/history — 200
interface OrderHistoryResponse {
  history: OrderHistoryItem[];
}

interface OrderHistoryItem {
  id: number;
  sessionId: number;
  orderSnapshot: OrderSnapshot;
  totalAmount: number;
  orderedAt: string;
  completedAt: string;
}

interface OrderSnapshot {
  order_id: number;
  order_number: string;
  status: string;
  items: OrderSnapshotItem[];
  total_amount: number;
  created_at: string;
}

interface OrderSnapshotItem {
  menu_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}
```

### 1.6 에러 응답

```typescript
interface ApiError {
  error: string;           // VALIDATION_ERROR, AUTH_ERROR, etc.
  message: string;
  details?: ValidationDetail[];
  retryAfter?: number;     // ACCOUNT_LOCKED 시 남은 분
}

interface ValidationDetail {
  field: string;
  message: string;
}
```

---

## 2. SSE 이벤트 데이터 타입

```typescript
interface SseNewOrderEvent {
  orderId: number;
  tableId: number;
  tableNumber: number;
  orderNumber: string;
  items: { menuName: string; quantity: number; unitPrice: number; subtotal: number }[];
  totalAmount: number;
}

interface SseOrderStatusChangedEvent {
  orderId: number;
  tableId: number;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
}

interface SseOrderDeletedEvent {
  orderId: number;
  tableId: number;
  newTableTotal: number;
}

interface SseSessionCompletedEvent {
  tableId: number;
  completedAt: string;
}
```

---

## 3. 로컬 상태 타입

### 3.1 장바구니 (localStorage 'cart')

```typescript
interface CartItem {
  menuId: number;
  menuName: string;
  unitPrice: number;
  quantity: number;
}
```

### 3.2 인증 토큰 (localStorage)

```typescript
// 'admin_token' → JWT 문자열
// 'table_token' → 테이블 토큰 문자열
// 'table_id' → number (문자열 저장)
// 'session_id' → number (문자열 저장)
```

### 3.3 SSE 연결 상태

```typescript
type SseConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
```

---

## 4. Context 타입

```typescript
interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  storeId: number | null;
  login: (storeIdentifier: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

interface TableAuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  tableId: number | null;
  sessionId: number | null;
  storeId: number | null;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (menu: MenuItem, quantity: number) => void;
  updateQuantity: (menuId: number, quantity: number) => void;
  removeItem: (menuId: number) => void;
  clear: () => void;
  totalAmount: number;
  itemCount: number;
}

interface ToastContextValue {
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}
```

---

## 5. API 요청 타입

```typescript
// POST /api/auth/login
interface LoginRequest {
  storeIdentifier: string;
  username: string;
  password: string;
}

// POST /api/auth/table-login
interface TableLoginRequest {
  storeIdentifier: string;
  tableNumber: number;
  password: string;
}

// POST /api/orders
interface CreateOrderRequest {
  items: { menuItemId: number; quantity: number }[];
}

// POST /api/tables/setup
interface SetupTableRequest {
  tableNumber: number;
  password: string;
}

// PATCH /api/orders/:orderId/status
interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// PUT /api/menus/order
interface UpdateMenuOrderRequest {
  orders: { id: number; displayOrder: number }[];
}

// PUT /api/categories/order
interface UpdateCategoryOrderRequest {
  orders: { id: number; displayOrder: number }[];
}

// POST /api/categories
interface CreateCategoryRequest {
  name: string;
}

// PUT /api/categories/:categoryId
interface UpdateCategoryRequest {
  name: string;
}

// POST /api/menus — multipart/form-data
// Fields: name(string), price(integer), description?(string),
//         categoryId(integer), image?(File)
```
