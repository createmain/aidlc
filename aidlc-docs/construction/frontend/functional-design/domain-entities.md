# Frontend - 도메인 엔티티 (데이터 모델)

---

## 1. API 응답 타입

### 1.1 인증

```typescript
// POST /api/auth/login 응답
interface LoginResponse {
  token: string;           // JWT
}

// POST /api/auth/table-login 응답
interface TableLoginResponse {
  token: string;           // 테이블 토큰
}

// JWT 디코딩 페이로드 (관리자)
interface AdminTokenPayload {
  adminId: number;
  storeId: number;
  role: 'admin';
  exp: number;             // 만료 시각 (Unix timestamp)
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
}

interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  price: number;           // 원 단위 정수
  description: string | null;
  imagePath: string | null; // 이미지 URL 경로
  displayOrder: number;
}
```

### 1.3 주문

```typescript
interface Order {
  id: number;
  tableId: number;
  sessionId: number;
  orderNumber: string;     // "ORD-YYYYMMDD-순번"
  status: OrderStatus;
  totalAmount: number;
  isDeleted: boolean;
  isArchived: boolean;
  items: OrderItem[];
  createdAt: string;       // ISO 8601
  updatedAt: string;
}

type OrderStatus = 'pending' | 'preparing' | 'completed';

interface OrderItem {
  id: number;
  menuItemId: number;
  menuName: string;        // 주문 시점 스냅샷
  quantity: number;
  unitPrice: number;       // 주문 시점 스냅샷
  subtotal: number;
}
```

### 1.4 테이블/세션

```typescript
interface Table {
  id: number;
  tableNumber: number;
}

interface TableStatus {
  tableId: number;
  tableNumber: number;
  sessionStatus: 'active' | 'expired' | 'none';
  orderCount: number;
  totalAmount: number;
}

interface TableSession {
  id: number;
  tableId: number;
  status: 'active' | 'expired';
  startedAt: string;
  expiresAt: string;
  completedAt: string | null;
}
```

### 1.5 주문 이력

```typescript
interface OrderHistory {
  id: number;
  tableId: number;
  sessionId: number;
  orderSnapshot: OrderSnapshot;
  totalAmount: number;
  orderedAt: string;       // 원본 주문 시각
  completedAt: string;     // 이용 완료 시각
}

interface OrderSnapshot {
  orderId: number;
  orderNumber: string;
  status: string;
  items: OrderSnapshotItem[];
  totalAmount: number;
  createdAt: string;
}

interface OrderSnapshotItem {
  menuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
```

### 1.6 에러 응답

```typescript
interface ApiError {
  error: string;           // 에러 코드 (VALIDATION_ERROR, AUTH_ERROR 등)
  message: string;         // 사용자 친화적 메시지
  details?: ValidationDetail[];
  retryAfter?: number;     // 계정 잠금 시 남은 분
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
  items: OrderItem[];
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

### 3.1 장바구니 (localStorage)

```typescript
interface CartItem {
  menuId: number;
  menuName: string;
  unitPrice: number;
  quantity: number;
}

// localStorage 키: 'cart'
// 저장 형식: JSON.stringify(CartItem[])
```

### 3.2 인증 토큰 (localStorage)

```typescript
// localStorage 키: 'admin_token'  → JWT 문자열
// localStorage 키: 'table_token'  → 테이블 토큰 문자열
```

### 3.3 SSE 연결 상태

```typescript
type SseConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
```

### 3.4 신규 주문 하이라이트

```typescript
// DashboardPage 로컬 상태
// 하이라이트된 테이블 ID 집합 (관리자가 카드 클릭 시 해제)
type HighlightedTables = Set<number>;
```

---

## 4. Context 타입

```typescript
// AuthContext (관리자)
interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  storeId: number | null;
  login: (storeId: string, username: string, password: string) => Promise<void>;
  logout: () => void;
}

// TableAuthContext (고객 태블릿)
interface TableAuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  tableId: number | null;
  sessionId: number | null;
  storeId: number | null;
}

// CartContext
interface CartContextValue {
  items: CartItem[];
  addItem: (menu: MenuItem, quantity: number) => void;
  updateQuantity: (menuId: number, quantity: number) => void;
  removeItem: (menuId: number) => void;
  clear: () => void;
  totalAmount: number;
  itemCount: number;
}

// ToastContext
interface ToastContextValue {
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}
```

---

## 5. API 요청 타입

```typescript
// POST /api/auth/login
interface LoginRequest {
  storeId: string;
  username: string;
  password: string;
}

// POST /api/auth/table-login
interface TableLoginRequest {
  storeId: string;
  tableNumber: number;
  password: string;
}

// POST /api/orders
interface CreateOrderRequest {
  items: { menuItemId: number; quantity: number }[];
}

// POST /api/tables
interface SetupTableRequest {
  tableNumber: number;
  password: string;
}

// PUT /api/orders/:orderId/status
interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

// PUT /api/menus/order
interface UpdateMenuOrderRequest {
  orders: { id: number; displayOrder: number }[];
}

// POST /api/menus (multipart/form-data)
// - name: string
// - price: number
// - description?: string
// - categoryId: number
// - image?: File

// POST /api/categories
interface CreateCategoryRequest {
  name: string;
}

// PUT /api/categories/:categoryId
interface UpdateCategoryRequest {
  name: string;
}
```
