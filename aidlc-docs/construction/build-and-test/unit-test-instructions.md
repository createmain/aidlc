# 유닛 테스트 지침

---

## 1. 개요

현재 Backend/Frontend 유닛은 MVP 단계로, 코드 생성 시 테스트 코드는 포함되지 않았습니다.
이 문서는 향후 유닛 테스트 추가 시 참고할 수 있는 테스트 전략과 실행 방법을 정의합니다.

---

## 2. 테스트 프레임워크 권장

### Backend

| 항목 | 권장 도구 |
|------|-----------|
| 테스트 러너 | Vitest 또는 Jest |
| HTTP 테스트 | supertest |
| DB 모킹 | pg-mem 또는 수동 모킹 |
| 커버리지 | vitest --coverage 또는 jest --coverage |

### Frontend

| 항목 | 권장 도구 |
|------|-----------|
| 테스트 러너 | Vitest |
| 컴포넌트 테스트 | React Testing Library (@testing-library/react) |
| DOM 환경 | jsdom (vitest 내장) |
| 사용자 이벤트 | @testing-library/user-event |
| API 모킹 | MSW (Mock Service Worker) |
| 커버리지 | vitest --coverage |

### package.json 스크립트 추가 (향후)

Backend (`packages/backend/package.json`):
```json
{
  "scripts": {
    "test": "vitest --run",
    "test:watch": "vitest",
    "test:coverage": "vitest --run --coverage"
  }
}
```

Frontend (`packages/frontend/package.json`):
```json
{
  "scripts": {
    "test": "vitest --run",
    "test:watch": "vitest",
    "test:coverage": "vitest --run --coverage"
  }
}
```

---

## 3. Backend 모듈별 테스트 대상

### 3.1 Auth 모듈
| 테스트 대상 | 검증 항목 |
|-------------|-----------|
| AuthService.adminLogin | 정상 로그인, 잘못된 비밀번호, 계정 잠금 (5회 실패), 잠금 해제 (15분 후) |
| AuthService.tableLogin | 정상 인증, 세션 없음, 세션 만료, 세션 완료 |
| auth.middleware | 유효한 JWT, 만료된 JWT, 잘못된 토큰, 역할 검증 |

### 3.2 Menu 모듈
| 테스트 대상 | 검증 항목 |
|-------------|-----------|
| MenuService.getMenus | 전체 조회, 카테고리 필터, 빈 결과 |
| MenuService.createMenu | 정상 생성, 필수 필드 누락, 존재하지 않는 카테고리 |
| MenuService.updateMenu | 정상 수정, 이미지 교체 시 기존 삭제, 메뉴 없음 |
| MenuService.deleteMenu | 정상 삭제, 이미지 파일 삭제, 메뉴 없음 |
| MenuService.updateMenuOrder | 순서 변경, 빈 배열 |
| CategoryService | CRUD, 기본 카테고리 삭제 방지, 삭제 시 메뉴 이동 |

### 3.3 Order 모듈
| 테스트 대상 | 검증 항목 |
|-------------|-----------|
| OrderService.createOrder | 정상 생성, 빈 items, 존재하지 않는 메뉴, 세션 만료 |
| OrderService.updateStatus | 허용 전이 (pending→preparing, preparing→completed, preparing→pending), 금지 전이 (completed→*, pending→completed) |
| OrderService.deleteOrder | 논리 삭제, 이미 삭제된 주문, 테이블 총액 재계산 |

### 3.4 Table 모듈
| 테스트 대상 | 검증 항목 |
|-------------|-----------|
| TableService.setupTable | 신규 테이블 생성, 기존 테이블 재설정 (세션 완료 + 새 세션) |
| TableService.completeSession | 주문 아카이브, 이력 복사, 세션 완료 처리 |
| TableService.getHistory | 날짜 필터, 빈 이력 |

### 3.5 System 모듈
| 테스트 대상 | 검증 항목 |
|-------------|-----------|
| SystemService.initialize | 관리자 계정 생성, 미분류 카테고리 생성, 이미 존재 시 스킵 |

### 3.6 Realtime 모듈
| 테스트 대상 | 검증 항목 |
|-------------|-----------|
| RealtimeService.addClient | 클라이언트 등록, 연결 해제 시 제거 |
| RealtimeService.broadcast | 관리자 이벤트 전송, 고객 이벤트 필터링 (테이블별) |

---

## 4. Frontend 컴포넌트별 테스트 대상

### 4.1 Context / Hook
| 테스트 대상 | 검증 항목 |
|-------------|-----------|
| AuthContext | 로그인 상태 관리, 토큰 저장/삭제, 로그아웃 |
| TableAuthContext | 테이블 인증 상태, 세션 정보 관리 |
| CartContext | 장바구니 추가/삭제/수량변경, 총액 계산, 장바구니 초기화 |
| ToastContext | 토스트 표시/자동 숨김 |
| useSse | SSE 연결/재연결, 이벤트 수신 처리, 연결 상태 표시 |

### 4.2 고객 페이지
| 테스트 대상 | 검증 항목 |
|-------------|-----------|
| MenuPage | 카테고리 사이드바 렌더링, 메뉴 카드 표시, 카테고리 필터링 |
| MenuDetailModal | 메뉴 상세 정보 표시, 수량 선택, 장바구니 추가 |
| CartPage | 장바구니 항목 표시, 수량 변경, 삭제, 총액 표시 |
| OrderConfirmPage | 주문 확인 정보 표시, 주문 제출 |
| OrderSuccessPage | 주문 성공 메시지, 카운트다운 표시 |
| OrderHistoryPage | 주문 이력 목록, 상태별 표시 |

### 4.3 관리자 페이지
| 테스트 대상 | 검증 항목 |
|-------------|-----------|
| LoginPage | 로그인 폼 검증, 에러 메시지 표시, 계정 잠금 안내 |
| DashboardPage | 테이블 카드 목록, 주문 상태 표시, SSE 실시간 업데이트 |
| TableManagementPage | 테이블 설정 폼, 세션 종료, 테이블 목록 |
| MenuManagementPage | 메뉴/카테고리 CRUD 폼, 이미지 업로드, 드래그 앤 드롭 순서 변경 |
| PastOrdersPage | 과거 주문 이력 조회, 날짜 필터 |

### 4.4 공통 컴포넌트
| 테스트 대상 | 검증 항목 |
|-------------|-----------|
| ConfirmDialog | 열기/닫기, 확인/취소 콜백 |
| EmptyState | 빈 상태 메시지 표시 |
| ErrorBoundary | 에러 발생 시 폴백 UI 표시 |
| LoadingSpinner | 로딩 상태 표시 |

### 4.5 API 클라이언트
| 테스트 대상 | 검증 항목 |
|-------------|-----------|
| apiClient.get/post/put/patch/delete | 요청 헤더 설정, 토큰 포함, 에러 핸들링 |
| apiClient (401 처리) | 401 응답 시 토큰 삭제 |

---

## 5. 테스트 실행 방법 (향후 구현 시)

```bash
# Backend 전체 유닛 테스트
cd packages/backend
npm test

# Backend 특정 모듈만 테스트
npm test -- --filter auth
npm test -- --filter menu

# Backend 커버리지 리포트
npm run test:coverage

# Frontend 전체 유닛 테스트
cd packages/frontend
npm test

# Frontend 특정 컴포넌트만 테스트
npm test -- --filter CartContext
npm test -- --filter MenuPage

# Frontend 커버리지 리포트
npm run test:coverage
```

---

## 6. 테스트 커버리지 목표

### Backend

| 영역 | 목표 |
|------|------|
| Service 레이어 | 80% 이상 |
| Repository 레이어 | 70% 이상 (DB 의존) |
| Controller 레이어 | 60% 이상 (통합 테스트로 보완) |
| Middleware | 90% 이상 |
| 전체 | 70% 이상 |

### Frontend

| 영역 | 목표 |
|------|------|
| Context / Hook | 80% 이상 |
| API 클라이언트 | 80% 이상 |
| 페이지 컴포넌트 | 60% 이상 |
| 공통 컴포넌트 | 70% 이상 |
| 전체 | 65% 이상 |
