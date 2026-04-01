# Frontend - 비즈니스 로직 모델

> API 엔드포인트/요청/응답은 `api-specification.md` 기준

---

## 1. 인증 로직

### 1.1 관리자 인증 (AuthContext)

```
로그인 흐름:
  입력: storeIdentifier, username, password
  │
  ├─ 1. 폼 검증 (빈 필드 확인)
  │     └─ 실패 → 인라인 에러
  │
  ├─ 2. POST /api/auth/login { storeIdentifier, username, password }
  │     ├─ 200 → JWT를 localStorage('admin_token') 저장
  │     │         AuthContext.setToken(jwt)
  │     │         /admin/dashboard로 이동
  │     ├─ 401 → 인라인 에러: "인증 실패"
  │     └─ 423 → 인라인 에러: "계정 잠금. {retryAfter}분 후 재시도"
  │
  └─ 3. 세션 유지
        ├─ 페이지 로드 시 localStorage에서 JWT 읽기
        ├─ JWT exp 확인 → 만료 시 삭제 → LoginPage
        └─ API 401 응답 → 자동 로그아웃

로그아웃:
  1. localStorage 'admin_token' 삭제
  2. AuthContext.clearToken()
  3. SSE 연결 종료
  4. /admin/login으로 이동
```

### 1.2 테이블 태블릿 인증 (TableAuthContext)

```
자동 로그인 흐름:
  앱 마운트 시:
  │
  ├─ 1. localStorage 'table_token' 확인
  │     └─ 없음 → 에러 화면: "관리자 재설정 필요"
  │
  ├─ 2. 토큰 exp 확인
  │     └─ 만료 → 에러 화면: "세션 만료. 관리자에게 문의하세요"
  │
  └─ 3. 유효 → TableAuthContext에 토큰/세션 정보 설정
        └─ 메뉴 화면 표시

초기 설정 (관리자가 태블릿에서 수행):
  1. /customer?store={storeIdentifier}&table={tableNumber}&password={password} 접속
  2. POST /api/auth/table-login { storeIdentifier, tableNumber, password }
  3. 200 → token, tableId, sessionId를 localStorage 저장
  4. 409 (STATE_ERROR) → 에러 화면: 서버 메시지 표시
  5. 이후 자동 로그인
```

---

## 2. 장바구니 로직 (CartContext)

```
데이터 구조 (localStorage 키: 'cart'):
  CartItem[] = [
    { menuId, menuName, unitPrice, quantity }
  ]

addItem(menu, quantity):
  ├─ 기존 항목 존재 → quantity 누적
  └─ 신규 → 배열에 추가
  → localStorage 동기화

updateQuantity(menuId, quantity):
  ├─ quantity <= 0 → 항목 제거
  └─ quantity > 0 → 수량 업데이트
  → localStorage 동기화

removeItem(menuId): 항목 제거 → localStorage 동기화
clear(): 빈 배열 → localStorage 동기화
getTotalAmount(): SUM(unitPrice × quantity)
getItemCount(): SUM(quantity)

초기화: 앱 마운트 시 localStorage 'cart' 읽기, 파싱 실패 시 빈 배열
```

---

## 3. 주문 생성 로직

```
주문 확정 흐름:
  │
  ├─ 1. 장바구니 비어있음 → 버튼 비활성화
  │
  ├─ 2. 주문 데이터 구성
  │     { items: [{ menuItemId, quantity }] }
  │     (tableId, sessionId는 JWT에서 서버가 추출)
  │
  ├─ 3. POST /api/orders (테이블 토큰 인증)
  │     ├─ 201 → OrderSuccessPage 이동 (orderNumber 전달)
  │     ├─ 400 → 토스트: 검증 에러
  │     ├─ 401 → 에러 화면: "세션 만료"
  │     ├─ 409 → 토스트: 서버 메시지 (세션 없음/만료/완료)
  │     └─ 500 → 토스트: "주문 실패. 다시 시도해 주세요"
  │
  └─ 4. 실패 시 장바구니 유지

주문 성공 후 카운트다운:
  1. OrderSuccessPage 마운트 → CartContext.clear()
  2. countdown = 5, setInterval 1초
  3. 사용자 터치/네비게이션 → clearInterval, cancelled = true
  4. countdown === 0 && !cancelled → navigate('/customer/menu')
  5. "메뉴로 돌아가기" 버튼 항상 표시
```

---

## 4. 실시간 통신 로직 (useSse 훅)

```
관리자 대시보드 SSE:
  │
  ├─ 1. EventSource 생성
  │     url: /api/realtime/subscribe?token={jwt}
  │     (EventSource는 커스텀 헤더 미지원 → 쿼리 파라미터로 토큰 전달)
  │
  ├─ 2. 이벤트 리스너
  │     ├─ 'new-order' → 테이블 데이터 갱신 + 토스트 + 하이라이트
  │     ├─ 'order-status-changed' → 주문 상태 뱃지 갱신
  │     ├─ 'order-deleted' → 주문 제거 + newTableTotal로 총액 갱신
  │     └─ 'session-completed' → 테이블 카드 리셋
  │
  ├─ 3. 연결 상태 관리
  │     ├─ onopen → 'connected'
  │     ├─ onerror → 'disconnected'
  │     └─ 재연결 시 → 'reconnecting'
  │
  └─ 4. 재연결 후 → GET /api/tables 전체 재조회 (누락 이벤트 보상)

클린업: 컴포넌트 언마운트 시 EventSource.close()
```

---

## 5. 관리자 주문 관리 로직

### 5.1 주문 상태 변경

```
흐름:
  ├─ 1. 허용 전이 확인 (프론트엔드 사전 검증)
  │     pending → [preparing]
  │     preparing → [pending, completed]
  │     completed → [] (종착 상태, 변경 불가)
  │
  ├─ 2. PATCH /api/orders/:orderId/status { status: newStatus }
  │     ├─ 200 → 로컬 상태 즉시 갱신
  │     ├─ 409 → 토스트: 서버 메시지 (이미 변경됨 등)
  │     └─ 에러 → 토스트 + 롤백
  │
  └─ 3. Optimistic Update → 즉시 UI 반영 → 실패 시 롤백
```

### 5.2 주문 삭제

```
  1. 삭제 버튼 → ConfirmDialog
  2. 확인 → DELETE /api/orders/:orderId
     ├─ 200 → 토스트 성공 + 목록 제거 + newTableTotal로 총액 갱신
     └─ 실패 → 토스트 에러
```

### 5.3 이용 완료

```
  1. 이용 완료 버튼 → ConfirmDialog
     "테이블 {번호}의 이용을 완료하시겠습니까? 현재 주문이 과거 이력으로 이동됩니다."
  2. 확인 → POST /api/tables/:tableId/complete
     ├─ 200 → 토스트 성공 + 테이블 카드 갱신 (주문 0, 총액 0)
     └─ 409 → 토스트: "활성 세션 없음"
```

---

## 6. 관리자 메뉴 관리 로직

### 6.1 메뉴 CRUD

```
등록: MenuForm(빈 폼) → 검증 → POST /api/menus (multipart/form-data)
      201 → 토스트 + 목록 갱신 + 모달 닫기

수정: MenuForm(기존 데이터) → 수정 → PUT /api/menus/:menuId (multipart/form-data)
      200 → 토스트 + 목록 갱신 + 모달 닫기

삭제: ConfirmDialog → DELETE /api/menus/:menuId
      200 → 토스트 + 목록 제거
```

### 6.2 카테고리 CRUD

```
등록: 인라인 입력 → POST /api/categories { name }
수정: 인라인 편집 → PUT /api/categories/:categoryId { name }
삭제: ConfirmDialog("소속 메뉴가 미분류로 이동됩니다")
      → DELETE /api/categories/:categoryId
      200 → movedMenuCount 표시 + 목록 갱신
```

### 6.3 노출 순서 변경 (드래그 앤 드롭)

```
메뉴 순서:
  1. 드래그 앤 드롭 → 로컬 상태 즉시 반영
  2. "순서 저장" 버튼 활성화
  3. PUT /api/menus/order { orders: [{ id, displayOrder }] }
     (100 단위 간격 재계산)

카테고리 순서:
  1. 동일 방식 드래그 앤 드롭
  2. PUT /api/categories/order { orders: [{ id, displayOrder }] }
```

---

## 7. 테이블 관리 로직

### 7.1 테이블 초기 설정

```
  1. TableSetupForm: tableNumber + password 입력
  2. 검증 (인라인)
  3. POST /api/tables/setup { tableNumber, password }
     ├─ 201 → 토스트 + 테이블 목록 갱신
     │         응답: { tableId, tableNumber, sessionId, sessionExpiresAt }
     └─ 실패 → 토스트 에러
```

### 7.2 과거 주문 내역

```
  1. "과거 내역" 버튼 → OrderHistoryModal
  2. GET /api/tables/:tableId/history?from=&to=
  3. 날짜 필터 변경 시 재조회
  4. 목록: orderSnapshot 파싱하여 표시
  5. "닫기" → 모달 닫기
```
