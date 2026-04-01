# 테이블오더 서비스 - 서비스 레이어 설계

---

## 서비스 오케스트레이션 패턴

각 도메인 모듈은 독립적인 Service를 가지며, Controller → Service → Repository 흐름으로 동작합니다.
모듈 간 협력이 필요한 경우 Service 레벨에서 다른 Service를 호출합니다.

---

## 1. AuthService
- **역할**: 인증/인가 처리
- **협력**: 없음 (독립적)
- **미들웨어**: `authMiddleware` — 모든 보호된 라우트에서 JWT 검증

## 2. MenuService
- **역할**: 메뉴 데이터 CRUD, 카테고리 관리 및 이미지 관리
- **협력**: 없음 (독립적)
- **이미지 처리**: multer를 통한 파일 업로드 → `uploads/images/{category}/` 저장
- **카테고리 관리**: 카테고리 CRUD (메뉴 분류를 위한 카테고리 생성/조회/수정/삭제)

## 3. OrderService
- **역할**: 주문 생성, 상태 관리, 삭제
- **협력**:
  - `RealtimeService` — 주문 생성/상태 변경/삭제 시 실시간 이벤트 발행
  - `TableService` — 주문 생성 시 활성 테이블 세션 확인
- **오케스트레이션 흐름 (주문 생성)**:
  1. 주문 데이터 검증
  2. 활성 테이블 세션 확인 (없으면 에러 반환)
  3. 주문 저장 (OrderRepository)
  4. 실시간 이벤트 발행 (RealtimeService.sendToStore)

## 4. TableService
- **역할**: 테이블 설정, 세션 라이프사이클 관리
- **협력**:
  - `TableRepository` — 이용 완료 시 주문 데이터를 이력으로 이동 (moveOrdersToHistory)
  - `RealtimeService` — 세션 종료 시 대시보드 업데이트 이벤트 발행
- **오케스트레이션 흐름 (이용 완료)**:
  1. 활성 테이블 세션 확인
  2. 주문 내역을 order_history로 이동 (TableRepository.moveOrdersToHistory)
  3. 현재 주문/총액 리셋 (TableRepository.resetCurrentOrders)
  4. 실시간 이벤트 발행

## 5. RealtimeService
- **역할**: 실시간 이벤트 브로드캐스트
- **협력**: 없음 (다른 서비스에서 호출됨, 수동적 역할)
- **이벤트 타입**:
  - `new-order` — 신규 주문 생성
  - `order-status-changed` — 주문 상태 변경
  - `order-deleted` — 주문 삭제
  - `session-completed` — 테이블 이용 완료

## 6. SystemService
- **역할**: 시스템 초기화
- **협력**: 없음 (앱 시작 시 1회 실행)
- **실행 시점**: 서버 부팅 시 자동 실행
