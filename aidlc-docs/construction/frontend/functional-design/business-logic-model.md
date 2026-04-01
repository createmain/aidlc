# Frontend - 비즈니스 로직 모델

---

## 1. 인증 로직

### 1.1 관리자 인증 (AuthContext)

```
로그인 흐름:
  입력: storeId, username, password
  │
  ├─ 1. 폼 검증 (빈 필드 확인)
  │     └─ 실패 → 인라인 에러 표시
  │
  ├─ 2. POST /api/auth/login
  │     ├─ 성공 → JWT를 localStorage 저장
  │     │         AuthContext.setToken(jwt)
  │     │         /admin/dashboard로 이동
  │     ├─ 401 → 인라인 에러: "인증 실패"
  │     └─ 423 → 인라인 에러: "계정 잠금. {retryAfter}분 후 재시도"
  │
  └─ 3. 세션 유지
        ├─ 페이지 로드 시 localStorage에서 JWT 읽기
        ├─ JWT 만료 확인 (디코딩 후 exp 비교)
        │     └─ 만료 → localStorage 삭제 → LoginPage 이동
        └─ API 호출 시 401 응답 → 자동 로그아웃

로그아웃 흐름:
  1. localStorage에서 JWT 삭제
  2. AuthContext.clearToken()
  3. SSE 연결 종료
  4. /admin/login으로 이동
```

### 1.2 테이블 태블릿 인증 (TableAuthContext)

```
자동 로그인 흐름:
  앱 마운트 시:
  │
  ├─ 1. localStorage에서 테이블 토큰 확인
  │     └─ 없음 → 에러 화면: "관리자 재설정 필요"
  │
  ├─ 2. 토큰 만료 확인 (디코딩 후 exp 비교)
  │     └─ 만료 → 에러 화면: "세션 만료. 관리자에게 문의하세요"
  │
  └─ 3. 유효 → TableAuthContext에 토큰/세션 정보 설정
        └─ 메뉴 화면 표시

초기 설정 (관리자가 수행):
  1. 관리자가 테이블 설정 완료 후
  2. 태블릿 브라우저에서 /customer?store={storeId}&table={tableNumber}&password={password} 접속
  3. POST /api/auth/table-login 호출
  4. 성공 → 토큰을 localStorage 저장
  5. 이후 자동 로그인
```

---

## 2. 장바구니 로직 (CartContext)

```
데이터 구조 (localStorage 키: 'cart'):
  CartItem[] = [
    { menuId: number, menuName: string, unitPrice: number, quantity: number }
  ]

addItem(menu, quantity):
  │
  ├─ 기존 항목 존재 → quantity 누적
  └─ 신규 항목 → 배열에 추가
  → localStorage 동기화

updateQuantity(menuId, quantity):
  │
  ├─ quantity <= 0 → 항목 제거
  └─ quantity > 0 → 수량 업데이트
  → localStorage 동기화

removeItem(menuId):
  → 해당 항목 제거 → localStorage 동기화

clear():
  → 빈 배열로 초기화 → localStorage 동기화

getTotalAmount():
  → SUM(unitPrice × quantity) for all items

getItemCount():
  → SUM(quantity) for all items

초기화:
  앱 마운트 시 localStorage에서 'cart' 읽기
  파싱 실패 시 빈 배열로 초기화
```

---

## 3. 주문 생성 로직

```
주문 확정 흐름:
  입력: cartItems (CartContext에서)
  │
  ├─ 1. 장바구니 비어있음 확인
  │     └─ 비어있음 → 버튼 비활성화 (도달 불가)
  │
  ├─ 2. 주문 데이터 구성
  │     {
  │       items: cartItems.map(item => ({
  │         menuItemId: item.menuId,
  │         quantity: item.quantity
  │       }))
  │     }
  │
  ├─ 3. POST /api/orders (테이블 토큰 인증)
  │     ├─ 성공 → OrderSuccessPage 이동 (orderNumber 전달)
  │     │         장바구니 비우기는 OrderSuccessPage에서 수행
  │     ├─ 400 → 토스트: 검증 에러 메시지
  │     ├─ 401 → 에러 화면: "세션 만료"
  │     └─ 500 → 토스트: "주문 실패. 다시 시도해 주세요"
  │
  └─ 4. 장바구니 유지 (실패 시)

주문 성공 후 카운트다운:
  1. OrderSuccessPage 마운트 → CartContext.clear()
  2. countdown = 5, setInterval 1초
  3. 사용자 터치/네비게이션 감지 시 → clearInterval, cancelled = true
  4. countdown === 0 && !cancelled → navigate('/customer/menu')
  5. "메뉴로 돌아가기" 버튼 항상 표시
```

---

## 4. 실시간 통신 로직 (useSse 훅)

```
관리자 대시보드 SSE:
  연결 수립:
  │
  ├─ 1. EventSource 생성
  │     url: /api/realtime/subscribe
  │     headers: Authorization Bearer {jwt} (EventSource는 헤더 미지원 → 쿼리 파라미터로 토큰 전달)
  │
  ├─ 2. 이벤트 리스너 등록
  │     ├─ 'new-order' → 해당 테이블 데이터 갱신 + 토스트 + 하이라이트
  │     ├─ 'order-status-changed' → 해당 주문 상태 갱신
  │     ├─ 'order-deleted' → 해당 주문 제거 + 총액 갱신
  │     └─ 'session-completed' → 해당 테이블 상태 갱신
  │
  ├─ 3. 연결 상태 관리
  │     ├─ onopen → status = 'connected'
  │     ├─ onerror → status = 'disconnected'
  │     └─ 재연결 시 → status = 'reconnecting'
  │
  └─ 4. 재연결 후 데이터 동기화
        → GET /api/tables (전체 테이블 상태 재조회)

연결 상태 표시 (SseStatusIndicator):
  - connected: 초록 점 + "연결됨"
  - disconnected: 빨간 점 + "연결 끊김"
  - reconnecting: 노란 점 + "재연결 중..."

클린업:
  컴포넌트 언마운트 시 EventSource.close()
```

---

## 5. 관리자 주문 관리 로직

### 5.1 주문 상태 변경

```
상태 변경 흐름:
  입력: orderId, newStatus
  │
  ├─ 1. 허용 전이 확인 (프론트엔드 사전 검증)
  │     허용 전이 맵:
  │       pending → [preparing]
  │       preparing → [pending, completed]
  │       completed → [preparing]
  │     └─ 불허 → 버튼 비활성화 (도달 불가)
  │
  ├─ 2. PUT /api/orders/:orderId/status { status: newStatus }
  │     ├─ 성공 → 로컬 상태 갱신 (SSE로도 수신되지만 즉시 반영)
  │     ├─ 409 → 토스트: "상태 변경 불가" (다른 관리자가 이미 변경)
  │     └─ 에러 → 토스트: 에러 메시지
  │
  └─ 3. Optimistic Update
        → 즉시 UI 반영 → API 실패 시 롤백
```

### 5.2 주문 삭제

```
삭제 흐름:
  1. 삭제 버튼 클릭 → ConfirmDialog 표시
  2. 확인 → DELETE /api/orders/:orderId
     ├─ 성공 → 토스트: "주문이 삭제되었습니다" + 목록에서 제거 + 총액 갱신
     └─ 실패 → 토스트: 에러 메시지
  3. 취소 → ConfirmDialog 닫기
```

### 5.3 테이블 세션 종료 (이용 완료)

```
이용 완료 흐름:
  1. 이용 완료 버튼 클릭 → ConfirmDialog 표시
     메시지: "테이블 {번호}의 이용을 완료하시겠습니까? 현재 주문이 과거 이력으로 이동됩니다."
  2. 확인 → POST /api/tables/:tableId/complete
     ├─ 성공 → 토스트: "이용 완료 처리되었습니다" + 테이블 카드 갱신 (주문 0, 총액 0)
     └─ 실패 → 토스트: 에러 메시지
  3. 취소 → ConfirmDialog 닫기
```

---

## 6. 관리자 메뉴 관리 로직

### 6.1 메뉴 CRUD

```
메뉴 등록:
  1. MenuForm 열기 (빈 폼)
  2. 입력 + 이미지 선택 (미리보기 표시)
  3. 폼 검증 (인라인 에러)
  4. POST /api/menus (multipart/form-data)
     ├─ 성공 → 토스트 + 목록 갱신 + 모달 닫기
     └─ 실패 → 토스트 에러

메뉴 수정:
  1. MenuForm 열기 (기존 데이터 채움)
  2. 수정 + 이미지 교체 (선택)
  3. PUT /api/menus/:menuId (multipart/form-data)
     ├─ 성공 → 토스트 + 목록 갱신 + 모달 닫기
     └─ 실패 → 토스트 에러

메뉴 삭제:
  1. ConfirmDialog → DELETE /api/menus/:menuId
     ├─ 성공 → 토스트 + 목록에서 제거
     └─ 실패 → 토스트 에러
```

### 6.2 카테고리 CRUD

```
카테고리 등록:
  1. 인라인 입력 필드 + "추가" 버튼
  2. POST /api/categories { name }
     ├─ 성공 → 목록 갱신
     └─ 실패 → 토스트 에러 (중복명 등)

카테고리 수정:
  1. 카테고리명 인라인 편집
  2. PUT /api/categories/:categoryId { name }

카테고리 삭제:
  1. ConfirmDialog: "삭제 시 소속 메뉴가 미분류로 이동됩니다"
  2. DELETE /api/categories/:categoryId
     ├─ 성공 → 목록 갱신 + 메뉴 목록 갱신 (미분류 이동 반영)
     └─ 실패 → 토스트 에러 (기본 카테고리 삭제 불가 등)
```

### 6.3 메뉴 노출 순서 변경 (드래그 앤 드롭)

```
순서 변경 흐름:
  1. 카테고리 선택 → 해당 카테고리 메뉴 목록 표시
  2. 드래그 앤 드롭으로 순서 변경 (로컬 상태 즉시 반영)
  3. "순서 저장" 버튼 활성화
  4. 저장 클릭 → PUT /api/menus/order
     body: [{ id: menuId, display_order: newOrder }, ...]
     (100 단위 간격으로 재계산하여 전송)
     ├─ 성공 → 토스트: "순서가 저장되었습니다"
     └─ 실패 → 토스트 에러 + 원래 순서로 롤백
```

---

## 7. 테이블 관리 로직

### 7.1 테이블 초기 설정

```
설정 흐름:
  1. TableSetupForm: 테이블 번호 + 비밀번호 입력
  2. 폼 검증 (인라인 에러)
     - 테이블 번호: 필수, 정수, > 0
     - 비밀번호: 필수
  3. POST /api/tables { tableNumber, password }
     ├─ 성공 → 토스트 + 테이블 목록 갱신
     └─ 실패 → 토스트 에러
```

### 7.2 과거 주문 내역 조회

```
조회 흐름:
  1. 테이블 목록에서 "과거 내역" 버튼 클릭 → OrderHistoryModal 열기
  2. GET /api/tables/:tableId/history?from=&to=
  3. 날짜 필터 변경 시 재조회
  4. 목록 표시: 주문 번호, 시각, 메뉴 목록, 총 금액, 이용 완료 시각
  5. "닫기" 버튼 → 모달 닫기
```
