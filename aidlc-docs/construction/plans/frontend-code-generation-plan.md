# Frontend Code Generation Plan

## 유닛 컨텍스트
- **유닛**: Frontend (단일 React 앱)
- **코드 위치**: `packages/frontend/`
- **기술 스택**: React + TypeScript, Vite, MUI, Emotion, dnd-kit, react-router-dom
- **배포**: Nginx 컨테이너 (호스트 빌드 → COPY)
- **API 참조**: `aidlc-docs/construction/backend/functional-design/api-specification.md`

## 구현 스토리 (15개)
- US-C01: 테이블 태블릿 자동 로그인
- US-C02: 메뉴 조회 및 탐색
- US-C03: 장바구니 관리
- US-C04: 주문 생성
- US-C05: 주문 내역 조회
- US-C06: 주문 상태 실시간 업데이트 (선택, Could)
- US-A01: 매장 인증 (로그인)
- US-A02: 실시간 주문 모니터링
- US-A03: 실시간 신규 주문 알림
- US-A04: 테이블 초기 설정
- US-A05: 주문 삭제
- US-A06: 테이블 세션 종료
- US-A07: 과거 주문 내역 조회
- US-A08: 메뉴 및 카테고리 관리 (CRUD)
- US-A09: 테이블 목록 조회 및 관리

---

## 코드 생성 단계

### Step 1: 프로젝트 구조 및 설정 파일
- [x] `packages/frontend/package.json`
- [x] `packages/frontend/tsconfig.json`
- [x] `packages/frontend/vite.config.ts`
- [x] `packages/frontend/.env`
- [x] `packages/frontend/index.html`
- [x] `packages/frontend/nginx.conf`
- [x] `packages/frontend/Dockerfile`

### Step 2: 타입 정의 및 API 클라이언트
- [x] `src/types/index.ts`
- [x] `src/api/client.ts`
- [x] `src/api/auth.ts`
- [x] `src/api/menus.ts`
- [x] `src/api/categories.ts`
- [x] `src/api/orders.ts`
- [x] `src/api/tables.ts`

### Step 3: Context 및 Hooks
- [x] `src/contexts/AuthContext.tsx`
- [x] `src/contexts/TableAuthContext.tsx`
- [x] `src/contexts/CartContext.tsx`
- [x] `src/contexts/ToastContext.tsx`
- [x] `src/hooks/useSse.ts`

### Step 4: Shared 컴포넌트
- [x] `src/components/shared/LoadingSpinner.tsx`
- [x] `src/components/shared/ErrorBoundary.tsx`
- [x] `src/components/shared/ConfirmDialog.tsx`
- [x] `src/components/shared/EmptyState.tsx`

### Step 5: 라우팅 및 레이아웃
- [x] `src/App.tsx`
- [x] `src/main.tsx`
- [x] `src/pages/customer/CustomerLayout.tsx`
- [x] `src/pages/admin/AdminLayout.tsx`
- [x] `src/pages/admin/components/AdminHeader.tsx`
- [x] `src/pages/admin/components/AdminSidebar.tsx`

### Step 6: Customer UI — 메뉴 탐색
- [x] `src/pages/customer/MenuPage.tsx`
- [x] `src/pages/customer/components/CategorySidebar.tsx`
- [x] `src/pages/customer/components/MenuGrid.tsx`
- [x] `src/pages/customer/components/MenuCard.tsx`
- [x] `src/pages/customer/components/MenuDetailModal.tsx`

### Step 7: Customer UI — 장바구니 및 주문
- [x] `src/pages/customer/components/CartBar.tsx`
- [x] `src/pages/customer/CartPage.tsx`
- [x] `src/pages/customer/components/CartItem.tsx`
- [x] `src/pages/customer/OrderConfirmPage.tsx`
- [x] `src/pages/customer/OrderSuccessPage.tsx`
- [x] `src/pages/customer/OrderHistoryPage.tsx`

### Step 8: Admin UI — 로그인
- [x] `src/pages/admin/LoginPage.tsx`

### Step 9: Admin UI — 대시보드
- [x] `src/pages/admin/DashboardPage.tsx`
- [x] `src/pages/admin/components/TableCard.tsx`
- [x] `src/pages/admin/components/OrderDetailPanel.tsx`

### Step 10: Admin UI — 테이블 관리
- [x] `src/pages/admin/TableManagementPage.tsx`
- [x] `src/pages/admin/components/TableList.tsx`
- [x] `src/pages/admin/components/TableSetupForm.tsx`
- [x] `src/pages/admin/components/OrderHistoryModal.tsx`

### Step 11: Admin UI — 메뉴 관리
- [x] `src/pages/admin/MenuManagementPage.tsx`
- [x] `src/pages/admin/components/CategoryManager.tsx`
- [x] `src/pages/admin/components/MenuList.tsx`
- [x] `src/pages/admin/components/MenuForm.tsx`

### Step 12: 추가 페이지 및 요약
- [x] `src/pages/admin/PastOrdersPage.tsx`
- [x] 코드 생성 요약 문서

---

## 스토리 트레이서빌리티

| Story | 구현 Step |
|-------|-----------|
| US-C01 | Step 3 (TableAuthContext), Step 5 (CustomerLayout) |
| US-C02 | Step 6 (MenuPage, CategorySidebar, MenuGrid, MenuCard, MenuDetailModal) |
| US-C03 | Step 3 (CartContext), Step 7 (CartBar, CartPage, CartItem) |
| US-C04 | Step 7 (OrderConfirmPage, OrderSuccessPage) |
| US-C05 | Step 7 (OrderHistoryPage) |
| US-C06 | Step 3 (useSse — 선택사항, Could) |
| US-A01 | Step 3 (AuthContext), Step 8 (LoginPage) |
| US-A02 | Step 9 (DashboardPage, TableCard) |
| US-A03 | Step 3 (useSse), Step 5 (AdminHeader/SseStatusIndicator), Step 9 (DashboardPage) |
| US-A04 | Step 10 (TableSetupForm) |
| US-A05 | Step 9 (OrderDetailPanel — 삭제) |
| US-A06 | Step 9 (OrderDetailPanel — 이용 완료) |
| US-A07 | Step 10 (OrderHistoryModal) |
| US-A08 | Step 11 (MenuManagementPage, CategoryManager, MenuList, MenuForm) |
| US-A09 | Step 10 (TableManagementPage, TableList) |
