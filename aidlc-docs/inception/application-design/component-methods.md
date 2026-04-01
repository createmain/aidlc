# 테이블오더 서비스 - 컴포넌트 메서드 시그니처

> 상세 비즈니스 규칙은 Functional Design(CONSTRUCTION)에서 정의합니다.

---

## 1. Auth Module

### AuthController
- `login(req, res)` — 관리자 로그인 처리, JWT 토큰 반환
- `tableLogin(req, res)` — 테이블 태블릿 인증 처리, 세션 토큰 반환

### AuthService
- `authenticateAdmin(storeIdentifier, username, password): Promise<TokenPayload>` — 관리자 인증
- `authenticateTable(storeIdentifier, tableNumber, password): Promise<TokenPayload>` — 테이블 인증
- `verifyToken(token): Promise<DecodedToken>` — JWT 토큰 검증
- `checkLoginAttempts(identifier): Promise<boolean>` — 로그인 시도 제한 확인 (5회 실패 시 15분 잠금)

### AuthRepository
- `findAdminByUsername(username): Promise<AdminUser | null>`
- `findTableByNumber(tableNumber): Promise<Table | null>`
- `findStoreIdentifier(): Promise<string>`
- `incrementLoginAttempts(identifier): Promise<void>`
- `resetLoginAttempts(identifier): Promise<void>`

---

## 2. Menu Module

### MenuController
- `getMenus(req, res)` — 메뉴 목록 조회 (카테고리 필터 지원)
- `getMenuById(req, res)` — 메뉴 상세 조회
- `createMenu(req, res)` — 메뉴 등록 (이미지 업로드 포함)
- `updateMenu(req, res)` — 메뉴 수정
- `deleteMenu(req, res)` — 메뉴 삭제
- `updateMenuOrder(req, res)` — 메뉴 노출 순서 변경
- `getCategories(req, res)` — 카테고리 목록 조회
- `createCategory(req, res)` — 카테고리 등록
- `updateCategory(req, res)` — 카테고리 수정
- `deleteCategory(req, res)` — 카테고리 삭제
- `updateCategoryOrder(req, res)` — 카테고리 노출 순서 변경

### MenuService
- `getMenusByCategory(categoryId?): Promise<MenuItem[]>`
- `getMenuDetail(menuId): Promise<MenuItem>`
- `createMenu(data, imageFile): Promise<MenuItem>`
- `updateMenu(menuId, data, imageFile?): Promise<MenuItem>`
- `deleteMenu(menuId): Promise<void>`
- `updateDisplayOrder(menuOrders: {id, order}[]): Promise<void>`
- `getCategories(): Promise<Category[]>`
- `createCategory(data): Promise<Category>`
- `updateCategory(categoryId, data): Promise<Category>`
- `deleteCategory(categoryId): Promise<void>`
- `updateCategoryOrder(categoryOrders: {id, order}[]): Promise<void>`

### MenuRepository
- `findAll(categoryId?): Promise<MenuItem[]>`
- `findById(menuId): Promise<MenuItem | null>`
- `create(data): Promise<MenuItem>`
- `update(menuId, data): Promise<MenuItem>`
- `delete(menuId): Promise<void>`
- `updateOrder(menuOrders): Promise<void>`
- `findAllCategories(): Promise<Category[]>`
- `createCategory(data): Promise<Category>`
- `updateCategory(categoryId, data): Promise<Category>`
- `deleteCategory(categoryId): Promise<void>`
- `updateCategoryOrder(categoryOrders): Promise<void>`

---

## 3. Order Module

### OrderController
- `createOrder(req, res)` — 주문 생성
- `getOrdersBySession(req, res)` — 세션별 주문 목록 조회
- `getOrdersByTable(req, res)` — 테이블별 주문 목록 조회
- `updateOrderStatus(req, res)` — 주문 상태 변경
- `deleteOrder(req, res)` — 주문 삭제

### OrderService
- `createOrder(tableId, sessionId, items): Promise<Order>`
- `getOrdersBySession(sessionId): Promise<Order[]>`
- `getOrdersByTable(tableId): Promise<Order[]>`
- `updateStatus(orderId, status): Promise<Order>`
- `deleteOrder(orderId): Promise<void>`
- `recalculateTableTotal(tableId): Promise<number>`

### OrderRepository
- `create(orderData): Promise<Order>`
- `findBySessionId(sessionId): Promise<Order[]>`
- `findByTableId(tableId): Promise<Order[]>`
- `updateStatus(orderId, status): Promise<Order>`
- `delete(orderId): Promise<void>`
- `sumByTableId(tableId): Promise<number>`

---

## 4. Table Module

### TableController
- `getTables(req, res)` — 매장 테이블 목록 조회
- `setupTable(req, res)` — 테이블 초기 설정
- `completeSession(req, res)` — 이용 완료 (세션 종료)
- `getOrderHistory(req, res)` — 과거 주문 내역 조회
- `getTableStatus(req, res)` — 테이블 현재 상태 조회

### TableService
- `getTables(): Promise<Table[]>`
- `setupTable(tableNumber, password): Promise<Table>`
- `completeSession(tableId): Promise<void>`
- `getOrderHistory(tableId, dateFilter?): Promise<OrderHistory[]>`
- `getTableStatus(tableId): Promise<TableStatus>`

### TableRepository
- `create(data): Promise<Table>`
- `findByNumber(number): Promise<Table | null>`
- `findAll(): Promise<Table[]>`
- `createSession(tableId): Promise<TableSession>`
- `findActiveSession(tableId): Promise<TableSession | null>`
- `closeSession(sessionId, completedAt): Promise<void>`
- `resetCurrentOrders(sessionId): Promise<void>`
- `moveOrdersToHistory(sessionId): Promise<void>`
- `findOrderHistory(tableId, dateFilter?): Promise<OrderHistory[]>`

---

## 5. Realtime Module

### RealtimeController
- `subscribe(req, res)` — 실시간 연결 수립 (관리자 대시보드용)
- `subscribeCustomer(req, res)` — 실시간 연결 수립 (고객 주문 상태 업데이트용, 선택사항)

### RealtimeService
- `addClient(clientId, res): void` — 클라이언트 연결 등록
- `removeClient(clientId): void` — 클라이언트 연결 해제
- `broadcast(event, data): void` — 전체 관리자 클라이언트에 이벤트 전송
- `sendToTable(tableId, event, data): void` — 특정 테이블 클라이언트에 전송 (고객 주문 상태 업데이트용, 선택사항)

---

## 6. System Module

### SystemService
- `initializeSystem(): Promise<void>` — 시스템 초기화 (관리자 계정 생성)
- `isInitialized(): Promise<boolean>` — 초기화 여부 확인

### SystemRepository
- `findAdminCount(): Promise<number>`
- `createDefaultAdmin(data): Promise<AdminUser>`
