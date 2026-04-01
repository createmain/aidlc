# 테이블오더 서비스 - 컴포넌트 의존성

---

## 의존성 매트릭스

| 호출자 (→) | AuthService | MenuService | OrderService | TableService | RealtimeService | SystemService |
|------------|:-----------:|:-----------:|:------------:|:------------:|:----------:|:-------------:|
| AuthService | - | | | | | |
| MenuService | | - | | | | |
| OrderService | | | - | ✅ | ✅ | |
| TableService | | | | - | ✅ | |
| RealtimeService | | | | | - | |
| SystemService | | | | | | - |

- ✅ = 의존 관계 있음

---

## 통신 패턴

### Frontend → Backend
- **REST API** (HTTP): 모든 CRUD 작업
  - Customer UI → Auth, Menu, Order API
  - Admin UI → Auth, Menu, Order, Table API
- **Realtime** (단방향 스트림): 실시간 업데이트
  - Admin UI ← Realtime 엔드포인트 (신규 주문, 상태 변경)
  - Customer UI ← Realtime 엔드포인트 (주문 상태 변경, 선택사항)

### Backend 내부
- Controller → Service → Repository (동기 호출)
- Service → Service (모듈 간 협력, 동기 호출)
- Service → RealtimeService (이벤트 발행, fire-and-forget)

---

## 데이터 흐름

```mermaid
sequenceDiagram
    participant CUI as Customer UI
    participant OC as OrderController
    participant OS as OrderService
    participant TS as TableService
    participant OR as OrderRepository
    participant RT as RealtimeService

    Note over CUI, RT: 고객 주문 흐름
    CUI->>OC: POST /orders
    OC->>OS: createOrder()
    OS->>TS: findActiveSession() (테이블 세션 확인)
    OS->>OR: create() (주문 저장)
    OS->>RT: sendToStore() (실시간 알림)
    OS-->>CUI: 주문 번호 반환
```

```mermaid
sequenceDiagram
    participant AUI as Admin UI
    participant RC as RealtimeController
    participant RT as RealtimeService
    participant OS as OrderService

    Note over AUI, OS: 관리자 실시간 모니터링
    AUI->>RC: GET /realtime/subscribe
    RC->>RT: addClient() (연결 등록)
    RT-->>AUI: 실시간 스트림 유지
    Note over OS, RT: OrderService에서 이벤트 발생 시
    OS->>RT: broadcast()
    RT-->>AUI: 실시간 수신
```

```mermaid
sequenceDiagram
    participant AUI as Admin UI
    participant TC as TableController
    participant TS as TableService
    participant TR as TableRepository
    participant RT as RealtimeService

    Note over AUI, RT: 이용 완료 흐름
    AUI->>TC: POST /tables/:id/complete
    TC->>TS: completeSession()
    TS->>TR: moveOrdersToHistory()
    TS->>TR: closeSession()
    TS->>RT: sendToStore() (대시보드 업데이트)
    TS-->>AUI: 성공 응답
```

---

## 미들웨어 체인

```mermaid
graph LR
    REQ["요청"] --> CORS["CORS"]
    CORS --> JSON["JSON Parser"]
    JSON --> AUTH["Auth Middleware"]
    AUTH --> ROUTE["Route Handler"]
```

Auth Middleware 적용:
- 관리자 API: JWT 검증 필수
- 고객 API: 테이블 토큰 검증 필수
- 공개 API: 인증 불필요 (관리자 로그인, 테이블 로그인)
- Realtime: JWT 검증 필수 (관리자만)
