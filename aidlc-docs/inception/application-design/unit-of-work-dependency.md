# 테이블오더 서비스 - Unit of Work 의존성

---

## 유닛 의존성 매트릭스

| 유닛 (→ 의존) | Backend | Frontend |
|---------------|:-------:|:--------:|
| Backend       | -       |          |
| Frontend      | ✅      | -        |

- ✅ = 의존 관계 있음
- Frontend → Backend: REST API 호출 + Realtime(SSE) 수신

---

## 구현 순서

```
┌──────────────────────────────────────────────────┐
│  Phase 1: Backend                                │
│                                                  │
│  DB 스키마 + Auth + Menu + Order + Table +        │
│  Realtime + System                               │
│                                                  │
│  산출물: API 서버 전체, Docker 설정               │
└──────────────────────┬───────────────────────────┘
                       │
                       v
┌──────────────────────────────────────────────────┐
│  Phase 2: Frontend                               │
│                                                  │
│  Customer UI + Admin UI + Shared Components      │
│                                                  │
│  산출물: React 앱 전체, Docker 설정               │
└──────────────────────────────────────────────────┘
```

### 순서 근거
1. Frontend는 Backend API에 전적으로 의존 (모든 데이터 조회/생성이 API 통해 수행)
2. Backend는 외부 의존성 없이 독립 구현 가능
3. Backend 완성 후 Frontend에서 실제 API 연동하며 개발 → 통합 리스크 감소

---

## 통신 패턴

### Frontend → Backend (REST API)

| 영역 | 엔드포인트 그룹 | 인증 |
|------|-----------------|------|
| Customer UI | `POST /api/auth/table-login` | 없음 (로그인) |
| Customer UI | `GET /api/menus`, `GET /api/menus/:id` | 테이블 토큰 |
| Customer UI | `POST /api/orders`, `GET /api/orders/session/:id` | 테이블 토큰 |
| Admin UI | `POST /api/auth/login` | 없음 (로그인) |
| Admin UI | `GET/POST/PUT/DELETE /api/menus/*` | JWT |
| Admin UI | `GET/POST/PUT/DELETE /api/categories/*` | JWT |
| Admin UI | `GET/PUT/DELETE /api/orders/*` | JWT |
| Admin UI | `GET/POST /api/tables/*` | JWT |

### Backend → Frontend (Realtime/SSE)

| 이벤트 | 발신 모듈 | 수신 영역 |
|--------|-----------|-----------|
| `new-order` | OrderService | Admin UI (대시보드) |
| `order-status-changed` | OrderService | Admin UI (대시보드) |
| `order-deleted` | OrderService | Admin UI (대시보드) |
| `session-completed` | TableService | Admin UI (대시보드) |

### 유닛 간 계약
- Backend는 REST API 스펙(엔드포인트, 요청/응답 형식)을 정의
- Frontend는 해당 스펙에 맞춰 API 클라이언트 구현
- Realtime 이벤트 형식(이벤트명, 데이터 구조)은 Backend에서 정의
