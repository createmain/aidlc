# 테이블오더 서비스 - Unit of Work 정의

---

## 유닛 분해 요약

| 항목 | 값 |
|------|-----|
| 분해 전략 | 배포 단위별 (DB를 백엔드에 포함) |
| 총 유닛 수 | 2개 |
| 구현 순서 | Backend 우선 → Frontend |
| 프로젝트 구조 | 모노레포 |

---

## Unit 1: Backend

### 기본 정보
- **이름**: backend
- **목적**: 테이블오더 서비스의 API 서버, DB 스키마, 비즈니스 로직 전체
- **기술 스택**: Node.js + Express/Fastify (TypeScript), PostgreSQL, pg 드라이버

### 범위
- DB 스키마 설계 및 초기화 (10개 테이블)
- 6개 도메인 모듈: Auth, Menu, Order, Table, Realtime, System
- 각 모듈 내부: routes → controller → service → repository 레이어
- JWT 인증 및 테이블 토큰 인증
- Realtime(SSE) 통신
- 이미지 파일 업로드/서빙
- Docker 설정

### 포함 모듈
| 모듈 | 책임 |
|------|------|
| Auth | 관리자 JWT 인증, 테이블 태블릿 인증, 로그인 시도 제한 |
| Menu | 메뉴/카테고리 CRUD, 이미지 업로드, 노출 순서 관리 |
| Order | 주문 생성, 상태 변경, 삭제, 실시간 이벤트 발행 |
| Table | 테이블 설정, 세션 라이프사이클, 이용 완료, 과거 내역 |
| Realtime | SSE 연결 관리, 이벤트 브로드캐스트 |
| System | 시스템 초기화 (관리자 계정 자동 생성) |

### DB 테이블
settings, admin_users, tables, table_sessions, categories, menu_items, orders, order_items, order_history, login_attempts

---

## Unit 2: Frontend

### 기본 정보
- **이름**: frontend
- **목적**: 고객 주문 UI + 관리자 관리 UI (단일 React 앱, 라우팅 분리)
- **기술 스택**: React + TypeScript, useState/useContext

### 범위
- 고객 UI (`/customer/*`): 메뉴 탐색, 장바구니, 주문 생성, 주문 내역
- 관리자 UI (`/admin/*`): 로그인, 주문 대시보드, 테이블 관리, 메뉴 관리, 과거 내역
- 공통 컴포넌트: 레이아웃, 에러 처리, 로딩, API 클라이언트, 인증 컨텍스트
- Realtime 수신 (관리자 대시보드)
- localStorage 장바구니 관리

### 포함 영역
| 영역 | 책임 |
|------|------|
| Customer UI | 태블릿 자동 로그인, 메뉴 카드 표시, 장바구니(localStorage), 주문 생성/내역 |
| Admin UI | JWT 로그인, 실시간 대시보드, 주문 상태 변경, 테이블/메뉴 관리, 과거 내역 |
| Shared | 공통 레이아웃, API 클라이언트(axios/fetch), 인증 컨텍스트, 에러/로딩 처리 |

---

## 코드 조직 전략 (Greenfield 모노레포)

```
table-order/
  packages/
    backend/
      src/
        modules/
          auth/
            auth.routes.ts
            auth.controller.ts
            auth.service.ts
            auth.repository.ts
          menu/
            menu.routes.ts
            menu.controller.ts
            menu.service.ts
            menu.repository.ts
          order/
            order.routes.ts
            order.controller.ts
            order.service.ts
            order.repository.ts
          table/
            table.routes.ts
            table.controller.ts
            table.service.ts
            table.repository.ts
          realtime/
            realtime.routes.ts
            realtime.controller.ts
            realtime.service.ts
          system/
            system.service.ts
            system.repository.ts
        middleware/
          auth.middleware.ts
          error.middleware.ts
        config/
          database.ts
          env.ts
        db/
          schema.sql
          seed.sql
        app.ts
        server.ts
      package.json
      tsconfig.json
      Dockerfile
    frontend/
      src/
        pages/
          customer/
          admin/
        components/
          shared/
        contexts/
        hooks/
        api/
        App.tsx
        main.tsx
      package.json
      tsconfig.json
      Dockerfile
  docker-compose.yml
  package.json
```
