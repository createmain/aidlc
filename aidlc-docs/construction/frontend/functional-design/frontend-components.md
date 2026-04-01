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

### 2.2 CategorySidebar
- **목적**: 카테고리 목록 표시 및 필터링
- **Props**: `categories: Category[]`, `selectedId: number | null`, `onSelect: (id: number | null) => void`
- **State**: 없음 (부모에서 관리)
- **동작**:
  - "전체" 항목 + 카테고리 목록 세로 나열
  - 선택된 카테고리 시각적 강조 (배경색)
  - 선택 시 `onSelect` 호출 → 부모가 메뉴 필터링
- **API**: `GET /api/categories` (마운트 시 부모에서 호출)

### 2.3 MenuGrid
- **목적**: 메뉴 카드 그리드 표시
- **Props**: `menus: MenuItem[]`, `onMenuClick: (menu: MenuItem) => void`
- **State**: 없음
- **동작**:
  - 반응형 그리드 레이아웃 (태블릿 최적화)
  - 메뉴 없을 시 EmptyState 표시
  - 카드 터치 시 `onMenuClick` → MenuDetailModal 열기

### 2.4 MenuCard
- **목적**: 개별 메뉴 카드
- **Props**: `menu: MenuItem`, `onClick: () => void`
- **표시 정보**: 이미지 (없으면 플레이스홀더), 메뉴명, 가격
- **터치 타겟**: 최소 44x44px

### 2.5 MenuDetailModal
- **목적**: 메뉴 상세 정보 + 장바구니 추가
- **Props**: `menu: MenuItem | null`, `open: boolean`, `onClose: () => void`, `onAddToCart: (menuId: number, quantity: number) => void`
- **State**: `quantity: number` (기본값 1)
- **표시 정보**: 이미지 (확대), 메뉴명, 가격, 설명
- **동작**:
  - 수량 조절 (+/- 버튼, 최소 1)
  - "장바구니 추가" 버튼 → `onAddToCart` 호출 → 모달 닫기
  - 닫기 버튼 또는 오버레이 클릭으로 닫기

### 2.6 CartBar (하단 고정)
- **목적**: 장바구니 요약 정보 상시 표시
- **Props**: `itemCount: number`, `totalAmount: number`, `onClick: () => void`
- **동작**:
  - 아이템 수 + 총 금액 표시
  - 아이템 0개일 때 비활성 상태 (터치 불가)
  - 터치 시 장바구니 페이지로 이동

### 2.7 CartPage
- **목적**: 장바구니 상세 관리
- **State**: CartContext에서 `cartItems` 읽기
- **동작**:
  - CartItem 목록 표시
  - 수량 변경 → CartContext 업데이트 → localStorage 동기화
  - 개별 삭제, 전체 비우기
  - 총 금액 표시
  - "주문하기" 버튼 → OrderConfirmPage 이동

### 2.8 CartItem
- **Props**: `item: CartItemData`, `onQuantityChange: (quantity: number) => void`, `onRemove: () => void`
- **표시 정보**: 메뉴명, 단가, 수량 (+/- 버튼), 소계, 삭제 버튼

### 2.9 OrderConfirmPage
- **목적**: 주문 최종 확인 및 확정
- **State**: `isSubmitting: boolean`
- **동작**:
  - 장바구니 내용 읽기 전용 표시 (메뉴명, 수량, 단가, 소계)
  - 총 금액 표시
  - "주문 확정" 버튼 → API 호출 (`POST /api/orders`)
  - 성공 → OrderSuccessPage 이동
  - 실패 → 토스트 에러 메시지, 장바구니 유지

### 2.10 OrderSuccessPage
- **목적**: 주문 성공 결과 표시 + 자동 리다이렉트
- **Props (route params)**: `orderNumber: string`
- **State**: `countdown: number` (5초 시작), `cancelled: boolean`
- **동작**:
  - 주문 번호 표시, 장바구니 비우기 (CartContext.clear)
  - 5초 카운트다운 표시
  - 사용자가 화면 터치 또는 다른 곳 이동 시 카운트다운 취소
  - 카운트다운 완료 시 메뉴 화면(`/customer/menu`)으로 자동 이동
  - "메뉴로 돌아가기" 버튼 항상 표시

### 2.11 OrderHistoryPage
- **목적**: 현재 세션 주문 내역 조회
- **State**: `orders: Order[]`, `isLoading: boolean`, `page: number`
- **API**: `GET /api/orders/session/:sessionId`
- **동작**:
  - 시간 순 주문 목록 표시
  - 페이지네이션 (더보기 버튼 또는 무한 스크롤)
  - 각 주문: 주문 번호, 시각, 메뉴/수량, 금액, 상태 뱃지

---

## 3. Admin UI 컴포넌트

### 3.1 AdminLayout
- **목적**: 관리자 UI 전체 레이아웃 래퍼
- **구조**: 상단 AdminHeader + 좌측 AdminSidebar + 우측 콘텐츠 영역
- **인증**: 마운트 시 localStorage에서 JWT 확인, 없거나 만료 시 LoginPage로 리다이렉트

### 3.2 AdminHeader
- **목적**: 상단 헤더 (매장명, SSE 상태, 로그아웃)
- **포함**: SseStatusIndicator, 로그아웃 버튼
- **SseStatusIndicator**: 초록 점(연결됨), 빨간 점(끊김), 노란 점(재연결 중)

### 3.3 AdminSidebar
- **목적**: 좌측 네비게이션
- **메뉴 항목**: 대시보드, 테이블 관리, 메뉴 관리, 과거 내역
- **동작**: 현재 경로에 해당하는 항목 활성 표시

### 3.4 LoginPage
- **목적**: 관리자 로그인
- **State**: `storeId: string`, `username: string`, `password: string`, `isSubmitting: boolean`, `error: string | null`
- **API**: `POST /api/auth/login`
- **동작**:
  - 매장 식별자, 사용자명, 비밀번호 입력 폼
  - 로그인 성공 → JWT를 localStorage 저장 → 대시보드 이동
  - 로그인 실패 → 인라인 에러 메시지 (잠금 시 남은 시간 표시)
  - 폼 검증: 빈 필드 시 인라인 에러

### 3.5 DashboardPage
- **목적**: 실시간 주문 모니터링 대시보드
- **State**: `tables: TableStatus[]`, `selectedTableId: number | null`, `newOrderTableIds: Set<number>`
- **API**: `GET /api/tables` (초기 로드), SSE `/api/realtime/subscribe` (실시간)
- **동작**:
  - 테이블별 카드 그리드 표시
  - SSE 이벤트 수신 시 해당 테이블 카드 데이터 갱신
  - 신규 주문 시: 토스트 알림 + 해당 테이블 카드 하이라이트 (확인 시까지 유지)
  - 테이블 카드 클릭 → OrderDetailPanel 열기
  - 테이블별 필터 드롭다운

### 3.6 TableCard
- **Props**: `table: TableStatus`, `isHighlighted: boolean`, `onClick: () => void`
- **표시 정보**: 테이블 번호, 세션 상태 뱃지(활성/만료), 주문 건수, 총 주문액, 최신 주문 미리보기 (1~2건)
- **동작**: 하이라이트 시 테두리/배경 강조

### 3.7 OrderDetailPanel
- **목적**: 선택된 테이블의 주문 목록 상세 (사이드 패널 또는 모달)
- **Props**: `tableId: number`, `open: boolean`, `onClose: () => void`
- **State**: `orders: Order[]`, `isLoading: boolean`
- **API**: `GET /api/orders?tableId=:tableId`
- **동작**:
  - 주문 목록 표시 (주문 번호, 시각, 상태, 메뉴 목록, 금액)
  - 각 주문별 상태 변경 버튼 (허용 전이만 활성화)
    - pending → preparing 버튼
    - preparing → completed / preparing → pending 버튼
    - completed → preparing 버튼
  - 주문 삭제 버튼 → ConfirmDialog → API 호출
  - 이용 완료 버튼 → ConfirmDialog → API 호출
  - 성공/실패 피드백 (토스트)

### 3.8 TableManagementPage
- **목적**: 테이블 목록 조회 및 관리
- **State**: `tables: Table[]`, `isLoading: boolean`
- **API**: `GET /api/tables`
- **포함 컴포넌트**:
  - TableList: 테이블 목록 (번호, 세션 상태, 주문 건수)
  - TableSetupForm: 테이블 초기 설정 폼 (번호, 비밀번호)
  - 각 테이블에서 과거 내역 버튼 → OrderHistoryModal

### 3.9 MenuManagementPage
- **목적**: 메뉴 및 카테고리 CRUD
- **State**: `menus: MenuItem[]`, `categories: Category[]`, `selectedCategory: number | null`
- **API**: `GET/POST/PUT/DELETE /api/menus/*`, `GET/POST/PUT/DELETE /api/categories/*`
- **포함 컴포넌트**:
  - CategoryManager: 카테고리 CRUD (추가/수정/삭제 인라인)
  - MenuList: 카테고리별 메뉴 목록 (드래그 앤 드롭으로 순서 변경)
  - MenuForm: 메뉴 등록/수정 모달 (메뉴명, 가격, 설명, 카테고리 선택, 이미지 업로드)
  - 순서 변경 후 "저장" 버튼 → `PUT /api/menus/order` (전체 순서 배열 전송)

### 3.10 MenuForm
- **Props**: `menu?: MenuItem` (수정 시), `categories: Category[]`, `open: boolean`, `onClose: () => void`, `onSave: () => void`
- **State**: `name`, `price`, `description`, `categoryId`, `imageFile`, `errors: Record<string, string>`
- **검증 규칙** (인라인 에러):
  - name: 필수, 1~100자
  - price: 필수, 정수, >= 0
  - categoryId: 필수
  - imageFile: 허용 확장자 (jpg, jpeg, png, gif, webp), 최대 5MB
- **동작**: 이미지 미리보기, 기존 이미지 표시 (수정 시)

### 3.11 PastOrdersPage
- **목적**: 과거 주문 내역 조회
- **State**: `history: OrderHistory[]`, `dateFilter: { from: string, to: string }`, `isLoading: boolean`
- **API**: `GET /api/tables/:tableId/history?from=&to=`
- **동작**:
  - 날짜 필터 (DatePicker)
  - 시간 역순 목록 표시
  - 각 항목: 주문 번호, 시각, 메뉴 목록, 총 금액, 이용 완료 시각
  - "닫기" 버튼 → 대시보드 복귀

---

## 4. Shared 컴포넌트

### 4.1 LoadingSpinner
- **Props**: `size?: 'small' | 'medium' | 'large'`, `fullPage?: boolean`
- **동작**: MUI CircularProgress 래퍼

### 4.2 ErrorBoundary
- **목적**: React 에러 바운더리
- **동작**: 에러 발생 시 폴백 UI 표시, "다시 시도" 버튼

### 4.3 Toast / ToastContainer
- **목적**: 토스트 알림 시스템
- **타입**: success, error, warning, info
- **동작**: 자동 사라짐 (3~5초), 수동 닫기 가능, 최대 3개 동시 표시
- **구현**: MUI Snackbar 기반

### 4.4 ConfirmDialog
- **Props**: `open: boolean`, `title: string`, `message: string`, `onConfirm: () => void`, `onCancel: () => void`, `isLoading?: boolean`
- **동작**: MUI Dialog 기반, 확인/취소 버튼

### 4.5 EmptyState
- **Props**: `message: string`, `icon?: ReactNode`
- **동작**: 데이터 없을 때 표시하는 안내 UI
