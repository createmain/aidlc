# Frontend - 컴포넌트 설계

---

## 1. 전체 컴포넌트 계층 구조

```
App
├── CustomerLayout (/customer/*)
│   ├── CategorySidebar
│   ├── MenuGrid
│   │   └── MenuCard
│   ├── MenuDetailModal
│   ├── CartBar (하단 고정)
│   ├── CartPage
│   │   └── CartItem
│   ├── OrderConfirmPage
│   ├── OrderSuccessPage
│   └── OrderHistoryPage
│       └── OrderHistoryItem
│
├── AdminLayout (/admin/*)
│   ├── AdminHeader
│   │   └── SseStatusIndicator
│   ├── AdminSidebar
│   ├── LoginPage
│   ├── DashboardPage
│   │   ├── TableCard
│   │   └── OrderDetailPanel (사이드 패널/모달)
│   │       └── OrderItem
│   ├── TableManagementPage
│   │   ├── TableList
│   │   ├── TableSetupForm
│   │   └── OrderHistoryModal
│   ├── MenuManagementPage
│   │   ├── CategoryManager
│   │   ├── MenuList (드래그 앤 드롭)
│   │   └── MenuForm (등록/수정 모달)
│   └── PastOrdersPage
│       └── PastOrderItem
│
└── Shared
    ├── LoadingSpinner
    ├── ErrorBoundary
    ├── Toast / ToastContainer
    ├── ConfirmDialog
    └── EmptyState
```

---

## 2. Customer UI 컴포넌트

### 2.1 CustomerLayout
- **목적**: 고객 UI 전체 레이아웃 래퍼
- **구조**: 좌측 CategorySidebar + 우측 콘텐츠 영역 + 하단 CartBar
- **인증**: 마운트 시 localStorage에서 테이블 토큰 확인, 없거나 만료 시 에러 화면 표시
- **디자인**: 모바일/태블릿 최적화, 카드 중심 레이아웃

### 2.2 CategorySidebar
- **목적**: 카테고리 목록 표시 및 필터링
- **Props**: `categories: Category[]`, `selectedId: number | null`, `onSelect: (id: number | null) => void`
- **동작**:
  - "전체" 항목 + 카테고리 목록 세로 나열
  - 선택된 카테고리 시각적 강조
  - 선택 시 `onSelect` 호출 → 부모가 메뉴 필터링
- **API**: `GET /api/categories` (부모에서 호출)

### 2.3 MenuGrid
- **목적**: 메뉴 카드 그리드 표시
- **Props**: `menus: MenuItem[]`, `onMenuClick: (menu: MenuItem) => void`
- **동작**: 반응형 그리드, 메뉴 없을 시 EmptyState, 카드 터치 시 MenuDetailModal 열기

### 2.4 MenuCard
- **목적**: 개별 메뉴 카드
- **Props**: `menu: MenuItem`, `onClick: () => void`
- **표시**: 이미지 (없으면 플레이스홀더), 메뉴명, 가격
- **터치 타겟**: 최소 44x44px

### 2.5 MenuDetailModal
- **목적**: 메뉴 상세 정보 + 장바구니 추가
- **Props**: `menu: MenuItem | null`, `open: boolean`, `onClose: () => void`, `onAddToCart: (menuId: number, quantity: number) => void`
- **State**: `quantity: number` (기본값 1)
- **표시**: 이미지(확대), 메뉴명, 가격, 설명
- **동작**: 수량 조절(+/- 버튼, 최소 1), "장바구니 추가" → `onAddToCart` → 모달 닫기

### 2.6 CartBar (하단 고정)
- **목적**: 장바구니 요약 상시 표시
- **Props**: `itemCount: number`, `totalAmount: number`, `onClick: () => void`
- **동작**: 아이템 수 + 총 금액 표시, 0개일 때 비활성, 터치 시 장바구니 페이지 이동

### 2.7 CartPage
- **목적**: 장바구니 상세 관리
- **State**: CartContext에서 `cartItems` 읽기
- **동작**: CartItem 목록, 수량 변경 → localStorage 동기화, 개별 삭제, 전체 비우기(ConfirmDialog), 총 금액, "주문하기" → OrderConfirmPage

### 2.8 CartItem
- **Props**: `item: CartItemData`, `onQuantityChange: (qty: number) => void`, `onRemove: () => void`
- **표시**: 메뉴명, 단가, 수량(+/- 버튼), 소계, 삭제 버튼

### 2.9 OrderConfirmPage
- **목적**: 주문 최종 확인 및 확정
- **State**: `isSubmitting: boolean`
- **동작**:
  - 장바구니 내용 읽기 전용 표시
  - "주문 확정" → `POST /api/orders`
  - 성공 → OrderSuccessPage 이동
  - 실패 → 토스트 에러, 장바구니 유지

### 2.10 OrderSuccessPage
- **목적**: 주문 성공 결과 + 자동 리다이렉트
- **Route params**: `orderNumber: string`
- **State**: `countdown: number` (5초), `cancelled: boolean`
- **동작**:
  - 주문 번호 표시, CartContext.clear()
  - 5초 카운트다운, 사용자 터치/이동 시 취소
  - 카운트다운 완료 시 `/customer/menu`로 이동
  - "메뉴로 돌아가기" 버튼 항상 표시

### 2.11 OrderHistoryPage
- **목적**: 현재 세션 주문 내역 조회
- **State**: `orders: Order[]`, `isLoading: boolean`
- **API**: `GET /api/orders` (sessionId는 JWT에서 추출)
- **동작**: 시간 순 주문 목록, 페이지네이션, 각 주문: 번호/시각/메뉴/금액/상태 뱃지

---

## 3. Admin UI 컴포넌트

### 3.1 AdminLayout
- **목적**: 관리자 UI 전체 레이아웃 래퍼
- **구조**: 상단 AdminHeader + 좌측 AdminSidebar + 우측 콘텐츠 영역
- **인증**: JWT 없거나 만료 시 LoginPage로 리다이렉트
- **디자인**: 데스크톱 대시보드 레이아웃

### 3.2 AdminHeader
- **목적**: 상단 헤더 (매장명, SSE 상태, 로그아웃)
- **포함**: SseStatusIndicator, 로그아웃 버튼
- **SseStatusIndicator**: 초록 점(연결됨), 빨간 점(끊김), 노란 점(재연결 중)

### 3.3 AdminSidebar
- **목적**: 좌측 네비게이션
- **메뉴 항목**: 대시보드, 테이블 관리, 메뉴 관리, 과거 내역
- **동작**: 현재 경로 활성 표시

### 3.4 LoginPage
- **목적**: 관리자 로그인
- **State**: `storeIdentifier`, `username`, `password`, `isSubmitting`, `error`
- **API**: `POST /api/auth/login` (body: `{ storeIdentifier, username, password }`)
- **동작**:
  - 성공 → JWT localStorage 저장 → 대시보드 이동
  - 401 → 인라인 에러: "인증 실패"
  - 423 → 인라인 에러: "계정 잠금. {retryAfter}분 후 재시도"

### 3.5 DashboardPage
- **목적**: 실시간 주문 모니터링 대시보드
- **State**: `tables: TableStatus[]`, `selectedTableId: number | null`, `highlightedTableIds: Set<number>`
- **API**: `GET /api/tables` (초기), SSE `GET /api/realtime/subscribe`
- **동작**:
  - 테이블별 카드 그리드
  - SSE 이벤트 수신 → 해당 테이블 데이터 갱신
  - 신규 주문: 토스트 + 카드 하이라이트 (확인 시까지 유지)
  - 카드 클릭 → OrderDetailPanel 열기 + 하이라이트 해제
  - 테이블별 필터 드롭다운

### 3.6 TableCard
- **Props**: `table: TableStatus`, `isHighlighted: boolean`, `onClick: () => void`
- **표시**: 테이블 번호, 세션 상태 뱃지(active/completed/expired/null), 주문 건수, 총 주문액, 최신 주문 미리보기

### 3.7 OrderDetailPanel
- **목적**: 선택된 테이블의 주문 목록 상세 (사이드 패널/모달)
- **Props**: `tableId: number`, `open: boolean`, `onClose: () => void`
- **State**: `orders: Order[]`, `isLoading: boolean`
- **API**: `GET /api/orders?tableId=:tableId`
- **동작**:
  - 주문 목록 (번호, 시각, 상태, 메뉴, 금액)
  - 상태 변경 버튼 (허용 전이만 활성화):
    - pending → "준비 시작" (preparing)
    - preparing → "준비 완료" (completed), "대기로 복귀" (pending)
    - completed → 변경 불가 (종착 상태)
  - API: `PATCH /api/orders/:orderId/status`
  - 주문 삭제: ConfirmDialog → `DELETE /api/orders/:orderId`
  - 이용 완료: ConfirmDialog → `POST /api/tables/:tableId/complete`

### 3.8 TableManagementPage
- **목적**: 테이블 목록 조회 및 관리
- **API**: `GET /api/tables`
- **포함**:
  - TableList: 테이블 목록 (번호, 세션 상태, 주문 건수)
  - TableSetupForm: 초기 설정 (`POST /api/tables/setup` body: `{ tableNumber, password }`)
  - 각 테이블에서 과거 내역 → OrderHistoryModal

### 3.9 MenuManagementPage
- **목적**: 메뉴 및 카테고리 CRUD
- **API**: Menu API + Category API (api-specification.md 참조)
- **포함**:
  - CategoryManager: 카테고리 CRUD + 드래그 앤 드롭 순서 변경 (`PUT /api/categories/order`)
  - MenuList: 카테고리별 메뉴 목록, 드래그 앤 드롭 순서 변경 (`PUT /api/menus/order`)
  - MenuForm: 등록/수정 모달 (multipart/form-data)

### 3.10 MenuForm
- **Props**: `menu?: MenuItem`, `categories: Category[]`, `open: boolean`, `onClose`, `onSave`
- **State**: `name`, `price`, `description`, `categoryId`, `imageFile`, `errors`
- **검증** (인라인):
  - name: 필수, 1~100자
  - price: 필수, 정수, >= 0
  - categoryId: 필수
  - image: jpg/jpeg/png/gif/webp, 최대 5MB
- **동작**: 이미지 미리보기, 기존 이미지 표시(수정 시)

### 3.11 PastOrdersPage
- **목적**: 과거 주문 내역 조회
- **API**: `GET /api/tables/:tableId/history?from=&to=`
- **동작**: 날짜 필터(DatePicker), 시간 역순 목록, 각 항목: 주문 번호/시각/메뉴/총액/이용 완료 시각, "닫기" → 대시보드

---

## 4. Shared 컴포넌트

### 4.1 LoadingSpinner
- MUI CircularProgress 래퍼, `size` / `fullPage` props

### 4.2 ErrorBoundary
- React 에러 바운더리, 폴백 UI + "다시 시도" 버튼

### 4.3 Toast / ToastContainer
- MUI Snackbar 기반, success/error/warning/info, 자동 사라짐, 최대 3개 동시

### 4.4 ConfirmDialog
- MUI Dialog 기반, `title`/`message`/`onConfirm`/`onCancel`/`isLoading` props

### 4.5 EmptyState
- 데이터 없을 때 안내 UI, `message`/`icon` props
