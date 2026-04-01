# Backend - 비즈니스 로직 모델

---

## 1. Auth 모듈

### 1.1 관리자 로그인 흐름

```
입력: storeId, username, password
  │
  ├─ 1. 로그인 시도 제한 확인 (checkLoginAttempts)
  │     ├─ locked_until > NOW() → 에러: "15분간 잠금 상태" (남은 시간 포함)
  │     └─ 잠금 아님 → 계속
  │
  ├─ 2. 관리자 조회 (findAdminByStoreAndUsername)
  │     └─ 없음 → incrementLoginAttempts → 에러: "인증 실패"
  │
  ├─ 3. 비밀번호 검증 (bcrypt.compare)
  │     └─ 불일치 → incrementLoginAttempts → 5회 도달 시 locked_until 설정 → 에러: "인증 실패"
  │
  ├─ 4. 성공 → resetLoginAttempts
  │
  └─ 5. JWT 토큰 발급
        payload: { adminId, storeId, role: 'admin' }
        expiresIn: '16h'
```

### 1.2 테이블 태블릿 인증 흐름

```
입력: storeId, tableNumber, password
  │
  ├─ 1. 테이블 조회 (findTableByStoreAndNumber)
  │     └─ 없음 → 에러: "테이블 정보 없음"
  │
  ├─ 2. 비밀번호 검증 (bcrypt.compare)
  │     └─ 불일치 → 에러: "인증 실패"
  │
  ├─ 3. 활성 세션 확인 (findActiveSession)
  │     └─ 없음 또는 만료 → 에러: "활성 세션 없음, 관리자 재설정 필요"
  │
  └─ 4. 테이블 토큰 발급
        payload: { tableId, storeId, sessionId, role: 'table' }
        expiresIn: 세션 남은 시간
```

### 1.3 토큰 검증 (미들웨어)

```
입력: Authorization 헤더 (Bearer token)
  │
  ├─ 토큰 없음 → 401 Unauthorized
  ├─ 토큰 만료 → 401 Unauthorized
  ├─ 토큰 유효 → req.user에 디코딩된 payload 설정
  └─ role 기반 라우트 보호:
       - 관리자 라우트: role === 'admin' 필수
       - 고객 라우트: role === 'table' 필수
```

### 1.4 로그인 시도 제한 로직

```
식별자: "{storeId}:{username}"
  │
  ├─ 시도 시 → attempt_count++, last_attempt_at = NOW()
  ├─ 5회 도달 → locked_until = NOW() + 15분
  ├─ 성공 시 → attempt_count = 0, locked_until = NULL
  └─ locked_until 경과 후 → 자동 잠금 해제 (다음 시도 시 리셋)
```

---

## 2. Menu 모듈

### 2.1 메뉴 CRUD 흐름

#### 메뉴 등록
```
입력: name, price, description, categoryId, imageFile
  │
  ├─ 1. 입력 검증 (name 필수, price >= 0, categoryId 존재 확인)
  ├─ 2. 이미지 처리 (imageFile 있으면)
  │     ├─ 파일 저장: uploads/images/{categoryName}/{uuid}.{ext}
  │     └─ image_path 설정
  ├─ 3. display_order 설정
  │     └─ 해당 카테고리 내 MAX(display_order) + 100
  └─ 4. DB 저장 → 생성된 메뉴 반환
```

#### 메뉴 수정
```
입력: menuId, name?, price?, description?, categoryId?, imageFile?
  │
  ├─ 1. 메뉴 존재 확인
  ├─ 2. 입력 검증
  ├─ 3. 이미지 교체 (새 imageFile 있으면)
  │     ├─ 기존 이미지 파일 삭제 (파일시스템)
  │     └─ 새 이미지 저장, image_path 갱신
  ├─ 4. updated_at = NOW()
  └─ 5. DB 업데이트 → 수정된 메뉴 반환
```

#### 메뉴 삭제
```
입력: menuId
  │
  ├─ 1. 메뉴 존재 확인
  ├─ 2. 이미지 파일 삭제 (image_path 있으면 파일시스템에서 즉시 삭제)
  └─ 3. DB에서 메뉴 레코드 삭제 (물리 삭제)
```

### 2.2 카테고리 관리 흐름

#### 카테고리 삭제
```
입력: categoryId
  │
  ├─ 1. 미분류 카테고리(is_default=TRUE) 여부 확인
  │     └─ 미분류 카테고리 → 에러: "기본 카테고리는 삭제 불가"
  ├─ 2. 소속 메뉴 확인
  │     └─ 메뉴 있음 → 미분류 카테고리로 category_id 일괄 변경
  └─ 3. 카테고리 삭제
```

### 2.3 메뉴 노출 순서 관리

```
방식: 간격 기반 (100 단위)
  │
  ├─ 신규 메뉴: MAX(display_order) + 100
  ├─ 순서 변경 API: 클라이언트에서 전체 순서 배열 전송
  │     입력: [{ id: 1, display_order: 100 }, { id: 3, display_order: 200 }, ...]
  │     처리: 트랜잭션 내에서 일괄 UPDATE
  └─ 카테고리 노출 순서도 동일 방식 적용
```

---

## 3. Order 모듈

### 3.1 주문 생성 흐름

```
입력: storeId, tableId, sessionId, items[{menuItemId, quantity}]
  │
  ├─ 1. 활성 세션 확인 (테이블 세션 유효성)
  │     ├─ 세션 없음/만료 → 에러: "유효한 세션 없음"
  │     └─ 활성 → 계속
  │
  ├─ 2. 메뉴 항목 검증
  │     ├─ 각 menuItemId 존재 확인
  │     ├─ 수량 > 0 확인
  │     └─ 현재 가격 조회
  │
  ├─ 3. 주문 번호 생성
  │     └─ 형식: "ORD-{YYYYMMDD}-{순번}" (매장별 일일 순번)
  │
  ├─ 4. 주문 저장 (트랜잭션)
  │     ├─ orders 레코드 생성 (status: 'pending')
  │     ├─ order_items 레코드 생성 (menu_name, unit_price 스냅샷)
  │     └─ total_amount 계산 (SUM of subtotals)
  │
  └─ 5. Realtime 이벤트 발행
        event: 'new-order'
        data: { orderId, tableId, orderNumber, items, totalAmount }
```

### 3.2 주문 상태 전이

```
허용 전이 (유연한 양방향):
  pending ↔ preparing ↔ completed

  ├─ pending → preparing (준비 시작)
  ├─ preparing → completed (준비 완료)
  ├─ preparing → pending (준비 취소, 대기로 복귀)
  ├─ completed → preparing (완료 취소, 준비중으로 복귀)
  └─ pending → completed (직접 완료 처리 불가 — 반드시 preparing 거쳐야 함)

상태 변경 시:
  1. 현재 상태 확인
  2. 전이 유효성 검증
  3. status 업데이트, updated_at = NOW()
  4. Realtime 이벤트 발행: 'order-status-changed'
```

### 3.3 주문 삭제 (논리 삭제)

```
입력: orderId
  │
  ├─ 1. 주문 존재 확인 (is_deleted=FALSE)
  ├─ 2. is_deleted = TRUE, updated_at = NOW()
  ├─ 3. 테이블 총 주문액 재계산
  │     └─ SUM(total_amount) WHERE table_id=X AND is_deleted=FALSE AND is_archived=FALSE
  └─ 4. Realtime 이벤트 발행: 'order-deleted'
```

### 3.4 테이블 총 주문액 계산

```
recalculateTableTotal(tableId):
  SELECT SUM(total_amount)
  FROM orders
  WHERE table_id = :tableId
    AND is_deleted = FALSE
    AND is_archived = FALSE
```

---

## 4. Table 모듈

### 4.1 테이블 초기 설정 흐름

```
입력: storeId, tableNumber, password
  │
  ├─ 1. 기존 테이블 확인
  │     ├─ 존재 → 비밀번호 업데이트 (bcrypt 해싱)
  │     └─ 없음 → 새 테이블 생성
  │
  ├─ 2. 테이블 세션 생성
  │     ├─ 기존 활성 세션 있으면 → 만료 처리 (status='expired')
  │     └─ 새 세션: status='active', expires_at = NOW() + 16h
  │
  └─ 3. 미분류 카테고리 확인/생성
        └─ 매장에 is_default=TRUE 카테고리 없으면 자동 생성
```

### 4.2 세션 라이프사이클

```
상태 흐름:
  active → expired (시간 경과 또는 관리자 재설정)

세션 만료 판정:
  - DB 조회 시 expires_at < NOW() 이면 만료로 간주
  - 별도 배치/크론 없음 — 조회 시점에 판정
  - 만료된 세션: 관리자가 수동으로 이용 완료 처리 필요

세션 상태 조회:
  1. table_sessions에서 table_id로 최신 세션 조회
  2. expires_at < NOW() → status를 'expired'로 표시 (응답에서만, DB 업데이트 선택적)
  3. 활성 세션: 주문 가능
  4. 만료 세션: 주문 불가, 관리자 재설정 안내
```

### 4.3 이용 완료 흐름

```
입력: tableId
  │
  ├─ 1. 활성 세션 확인
  │     └─ 없음 → 에러: "활성 세션 없음"
  │
  ├─ 2. 현재 주문 조회 (is_deleted=FALSE, is_archived=FALSE)
  │
  ├─ 3. 주문 이력 복사 (트랜잭션)
  │     ├─ 각 주문을 JSON 스냅샷으로 직렬화
  │     │     (order_items 포함, 논리 삭제된 주문 제외)
  │     ├─ order_history에 INSERT
  │     └─ 원본 orders의 is_archived = TRUE
  │
  ├─ 4. 세션 완료 처리
  │     └─ completed_at = NOW()
  │
  └─ 5. Realtime 이벤트 발행: 'session-completed'
        data: { tableId, completedAt }

이용 완료 후:
  - 동일 세션 내에서 새 주문 가능 (세션 만료 전까지)
  - 새 주문은 is_archived=FALSE로 생성
  - 다음 이용 완료 시 새 주문만 이력으로 복사
```

### 4.4 과거 주문 내역 조회

```
입력: tableId, dateFilter? { from, to }
  │
  ├─ 1. order_history에서 table_id로 조회
  ├─ 2. dateFilter 있으면 completed_at 범위 필터
  ├─ 3. completed_at DESC 정렬
  └─ 4. 각 레코드의 order_snapshot JSON 파싱하여 반환
```

### 4.5 테이블 상태 조회

```
입력: tableId
  │
  ├─ 1. 테이블 기본 정보 조회
  ├─ 2. 최신 세션 조회 → 만료 여부 판정
  ├─ 3. 현재 활성 주문 수 (is_deleted=FALSE, is_archived=FALSE)
  └─ 4. 현재 총 주문액 계산
        반환: { tableId, tableNumber, sessionStatus, orderCount, totalAmount }
```

---

## 5. Realtime 모듈

### 5.1 SSE 연결 관리

```
연결 수립 (관리자 대시보드):
  1. GET /api/realtime/subscribe (JWT 인증 필요)
  2. res.setHeader('Content-Type', 'text/event-stream')
  3. res.setHeader('Cache-Control', 'no-cache')
  4. res.setHeader('Connection', 'keep-alive')
  5. clientId 생성 (storeId 기반)
  6. 클라이언트 맵에 등록: clients[clientId] = { res, storeId }
  7. 연결 종료 시 (req.on('close')) → removeClient(clientId)

연결 수립 (고객 주문 상태, 선택사항):
  1. GET /api/realtime/subscribe/customer (테이블 토큰 인증)
  2. 동일 SSE 설정
  3. clientId: tableId 기반
  4. 테이블별 클라이언트 맵에 등록
```

### 5.2 이벤트 발행 흐름

```
sendToStore(storeId, event, data):
  1. clients 맵에서 storeId 일치하는 클라이언트 필터
  2. 각 클라이언트에 SSE 형식으로 전송:
     "event: {event}\ndata: {JSON.stringify(data)}\n\n"

sendToTable(tableId, event, data):  (선택사항)
  1. 테이블 클라이언트 맵에서 tableId 일치하는 클라이언트 필터
  2. SSE 형식으로 전송

이벤트 타입:
  - new-order: { orderId, tableId, tableNumber, orderNumber, items, totalAmount }
  - order-status-changed: { orderId, tableId, previousStatus, newStatus }
  - order-deleted: { orderId, tableId, newTableTotal }
  - session-completed: { tableId, completedAt }
```

### 5.3 연결 복구

```
클라이언트 측 재연결:
  - EventSource 자동 재연결 (브라우저 기본 동작)
  - 재연결 시 최신 데이터 전체 조회로 동기화
  - 서버 측 별도 메시지 큐/버퍼 없음 (MVP 수준)
```

---

## 6. System 모듈

### 6.1 시스템 초기화 흐름

```
서버 부팅 시 자동 실행:
  │
  ├─ 1. 관리자 계정 존재 확인 (findAdminCount)
  │     └─ count > 0 → 초기화 스킵
  │
  ├─ 2. 기본 매장 생성
  │     store_identifier: 'default'
  │     name: '기본 매장'
  │
  ├─ 3. 기본 관리자 생성
  │     username: 'admin'
  │     password: 'admin123' (bcrypt 해싱)
  │
  ├─ 4. 미분류 카테고리 생성
  │     name: '미분류'
  │     is_default: TRUE
  │
  └─ 5. 콘솔 로그 출력
        "시스템 초기화 완료. 기본 계정: admin / admin123"
```
