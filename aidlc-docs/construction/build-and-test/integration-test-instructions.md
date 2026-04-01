# 통합 테스트 지침

---

## 1. 개요

Backend 유닛의 모듈 간 상호작용과 전체 API 동작을 검증하는 통합 테스트 지침입니다.
컨테이너 환경에서 실제 PostgreSQL과 함께 API 엔드포인트를 테스트합니다.

---

## 2. 테스트 환경 준비

### 2.1 개발 환경 시작
```bash
# 개발 환경 시작 (Backend + PostgreSQL)
nerdctl compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

# 서비스 상태 확인
nerdctl compose ps

# 헬스체크 확인
curl http://localhost:3000/api/health
```

### 2.2 테스트 도구
- curl 또는 httpie (CLI)
- Postman / Insomnia (GUI)
- 자동화: supertest + vitest (향후)

---

## 3. 테스트 시나리오

### 시나리오 1: 시스템 초기화 및 관리자 로그인

**목적**: 서버 시작 시 시스템 초기화 → 관리자 로그인 흐름 검증

**테스트 순서**:
1. 서버 시작 후 헬스체크 확인
2. 관리자 로그인 (기본 계정: admin/admin123)
3. JWT 토큰 수신 확인

```bash
# 1. 헬스체크
curl http://localhost:3000/api/health
# 기대: {"status":"ok","db":"connected"}

# 2. 관리자 로그인
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"storeIdentifier":"default","username":"admin","password":"admin123"}'
# 기대: {"token":"<JWT>","expiresIn":"16h"}

# 3. 잘못된 비밀번호
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"storeIdentifier":"default","username":"admin","password":"wrong"}'
# 기대: 401 AUTH_ERROR
```

**검증 항목**:
- [ ] 서버 시작 시 관리자 계정 자동 생성
- [ ] 서버 시작 시 미분류 카테고리 자동 생성
- [ ] 정상 로그인 시 JWT 토큰 반환
- [ ] 잘못된 비밀번호 시 401 에러
- [ ] 5회 실패 시 423 계정 잠금

---

### 시나리오 2: 메뉴/카테고리 CRUD

**목적**: 카테고리 생성 → 메뉴 등록 → 조회 → 수정 → 삭제 전체 흐름 검증

**사전 조건**: 시나리오 1에서 획득한 관리자 JWT 토큰

```bash
# 변수 설정 (시나리오 1에서 획득한 토큰)
TOKEN="<관리자_JWT_토큰>"

# 1. 카테고리 생성
curl -X POST http://localhost:3000/api/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"음료"}'
# 기대: 201, id 반환

# 2. 카테고리 목록 조회
curl http://localhost:3000/api/categories \
  -H "Authorization: Bearer $TOKEN"
# 기대: 미분류 + 음료 카테고리 2개

# 3. 메뉴 등록 (이미지 없이)
curl -X POST http://localhost:3000/api/menus \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=아메리카노" \
  -F "price=4500" \
  -F "description=시그니처 커피" \
  -F "categoryId=<카테고리_ID>"
# 기대: 201, 메뉴 정보 반환

# 4. 메뉴 목록 조회
curl http://localhost:3000/api/menus \
  -H "Authorization: Bearer $TOKEN"
# 기대: 등록한 메뉴 포함

# 5. 메뉴 수정
curl -X PUT http://localhost:3000/api/menus/<메뉴_ID> \
  -H "Authorization: Bearer $TOKEN" \
  -F "price=5000"
# 기대: 200, 가격 변경 확인

# 6. 메뉴 삭제
curl -X DELETE http://localhost:3000/api/menus/<메뉴_ID> \
  -H "Authorization: Bearer $TOKEN"
# 기대: 200

# 7. 카테고리 삭제 (소속 메뉴 있을 때 미분류로 이동)
curl -X DELETE http://localhost:3000/api/categories/<카테고리_ID> \
  -H "Authorization: Bearer $TOKEN"
# 기대: 200, movedMenuCount 확인
```

**검증 항목**:
- [ ] 카테고리 CRUD 정상 동작
- [ ] 기본(미분류) 카테고리 삭제 시 400 에러
- [ ] 메뉴 CRUD 정상 동작 (이미지 포함/미포함)
- [ ] 카테고리 삭제 시 소속 메뉴 미분류로 이동
- [ ] 메뉴/카테고리 순서 변경 동작

---

### 시나리오 3: 테이블 설정 및 고객 인증

**목적**: 테이블 초기 설정 → 세션 생성 → 고객 태블릿 인증 흐름 검증

```bash
# 1. 테이블 초기 설정
curl -X POST http://localhost:3000/api/tables/setup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableNumber":1,"password":"table1234"}'
# 기대: 201, tableId + sessionId + sessionExpiresAt

# 2. 테이블 목록 조회
curl http://localhost:3000/api/tables \
  -H "Authorization: Bearer $TOKEN"
# 기대: 테이블 1번, sessionStatus=active

# 3. 고객 태블릿 인증
curl -X POST http://localhost:3000/api/auth/table-login \
  -H "Content-Type: application/json" \
  -d '{"storeIdentifier":"default","tableNumber":1,"password":"table1234"}'
# 기대: 200, token + tableId + sessionId

# 4. 세션 없는 테이블 인증 시도
curl -X POST http://localhost:3000/api/auth/table-login \
  -H "Content-Type: application/json" \
  -d '{"storeIdentifier":"default","tableNumber":99,"password":"test"}'
# 기대: 404 NOT_FOUND
```

**검증 항목**:
- [ ] 테이블 초기 설정 시 세션 자동 생성
- [ ] 기존 테이블 재설정 시 이전 세션 완료 + 새 세션 생성
- [ ] 고객 인증 시 JWT 토큰 반환 (role=table)
- [ ] 세션 없는 테이블 인증 시 적절한 에러

---

### 시나리오 4: 주문 생성 → 상태 변경 → 실시간 알림

**목적**: 고객 주문 → 관리자 상태 변경 → SSE 이벤트 수신 전체 흐름 검증

**사전 조건**: 시나리오 2의 메뉴, 시나리오 3의 테이블/세션

```bash
# 변수 설정
TABLE_TOKEN="<고객_JWT_토큰>"

# 1. SSE 구독 (별도 터미널에서 실행)
curl -N http://localhost:3000/api/realtime/subscribe \
  -H "Authorization: Bearer $TOKEN"
# 이벤트 스트림 수신 대기

# 2. 주문 생성 (고객)
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TABLE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"menuItemId":<메뉴_ID>,"quantity":2}]}'
# 기대: 201, 주문 정보 + orderNumber
# SSE: new-order 이벤트 수신 확인

# 3. 주문 목록 조회 (고객)
curl http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TABLE_TOKEN"
# 기대: 생성한 주문 포함

# 4. 주문 상태 변경: pending → preparing (관리자)
curl -X PATCH http://localhost:3000/api/orders/<주문_ID>/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"preparing"}'
# 기대: 200
# SSE: order-status-changed 이벤트 수신 확인

# 5. 주문 상태 변경: preparing → completed (관리자)
curl -X PATCH http://localhost:3000/api/orders/<주문_ID>/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}'
# 기대: 200
# SSE: order-status-changed 이벤트 수신 확인

# 6. 완료된 주문 상태 변경 시도
curl -X PATCH http://localhost:3000/api/orders/<주문_ID>/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"pending"}'
# 기대: 409 STATE_ERROR (completed는 종착 상태)
```

**검증 항목**:
- [ ] 고객 주문 생성 시 주문번호 (ORD-YYYYMMDD-순번) 생성
- [ ] 주문 생성 시 메뉴 가격 스냅샷 저장
- [ ] SSE로 new-order 이벤트 관리자에게 전달
- [ ] 허용된 상태 전이 정상 동작
- [ ] 금지된 상태 전이 시 409 에러
- [ ] SSE로 order-status-changed 이벤트 전달

---

### 시나리오 5: 이용 완료 (세션 종료) 및 과거 내역

**목적**: 이용 완료 처리 → 주문 아카이브 → 이력 조회 흐름 검증

```bash
# 1. 이용 완료 처리
curl -X POST http://localhost:3000/api/tables/<테이블_ID>/complete \
  -H "Authorization: Bearer $TOKEN"
# 기대: 200, completedAt 반환
# SSE: session-completed 이벤트 수신 확인

# 2. 테이블 상태 확인
curl http://localhost:3000/api/tables/<테이블_ID>/status \
  -H "Authorization: Bearer $TOKEN"
# 기대: sessionStatus=completed, orderCount=0

# 3. 과거 주문 내역 조회
curl http://localhost:3000/api/tables/<테이블_ID>/history \
  -H "Authorization: Bearer $TOKEN"
# 기대: 아카이브된 주문 이력 (JSON 스냅샷)

# 4. 이용 완료 후 고객 주문 시도
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TABLE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"menuItemId":<메뉴_ID>,"quantity":1}]}'
# 기대: 409 STATE_ERROR (세션 완료)

# 5. 테이블 재설정 (새 세션)
curl -X POST http://localhost:3000/api/tables/setup \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tableNumber":1,"password":"table1234"}'
# 기대: 201, 새 sessionId
```

**검증 항목**:
- [ ] 이용 완료 시 주문 → order_history 복사
- [ ] 원본 주문 is_archived = TRUE
- [ ] 세션 status = completed, completed_at 설정
- [ ] 완료된 세션에서 새 주문 불가
- [ ] 과거 내역 조회 정상 동작 (날짜 필터 포함)
- [ ] 테이블 재설정 시 새 세션 생성

---

### 시나리오 6: 주문 삭제 (논리 삭제)

**목적**: 관리자 주문 삭제 → 테이블 총액 재계산 검증

```bash
# 1. 주문 삭제
curl -X DELETE http://localhost:3000/api/orders/<주문_ID> \
  -H "Authorization: Bearer $TOKEN"
# 기대: 200, newTableTotal 반환
# SSE: order-deleted 이벤트 수신 확인

# 2. 삭제된 주문 재삭제 시도
curl -X DELETE http://localhost:3000/api/orders/<주문_ID> \
  -H "Authorization: Bearer $TOKEN"
# 기대: 409 STATE_ERROR (이미 삭제됨)

# 3. 주문 목록에서 삭제된 주문 제외 확인
curl http://localhost:3000/api/orders?tableId=<테이블_ID> \
  -H "Authorization: Bearer $TOKEN"
# 기대: 삭제된 주문 미포함
```

**검증 항목**:
- [ ] 논리 삭제 (is_deleted=TRUE) 정상 동작
- [ ] 삭제 후 테이블 총액 재계산
- [ ] 이미 삭제된 주문 재삭제 시 409 에러
- [ ] 삭제된 주문이 목록 조회에서 제외

---

## 4. 테스트 환경 정리

```bash
# 서비스 중지
nerdctl compose down

# 데이터 초기화 (볼륨 삭제)
nerdctl compose down -v
```
