# Backend Code Generation Plan

---

## 유닛 컨텍스트

| 항목 | 값 |
|------|-----|
| 유닛 | Backend |
| 기술 스택 | Node.js + Express (TypeScript), PostgreSQL, pg 드라이버 |
| 프로젝트 구조 | Greenfield 모노레포 (`packages/backend/`) |
| 코드 위치 | `packages/backend/` (워크스페이스 루트 기준) |
| 모듈 수 | 6개 (Auth, Menu, Order, Table, Realtime, System) |
| DB 테이블 수 | 10개 |
| API 엔드포인트 수 | 24개 |
| 담당 스토리 | US-A00~A09, US-C01, US-C02, US-C04~C06 (15개) |

### 의존성
- Frontend 유닛이 이 Backend의 API를 소비
- PostgreSQL 16 (Docker 컨테이너)
- 외부 라이브러리: express, pg, bcrypt, jsonwebtoken, multer, pino, pino-roll, uuid, cors

### 코드 조직 패턴
```
packages/backend/
  src/
    modules/
      auth/       (routes, controller, service, repository)
      menu/       (routes, controller, service, repository)
      order/      (routes, controller, service, repository)
      table/      (routes, controller, service, repository)
      realtime/   (routes, controller, service)
      system/     (service, repository)
    middleware/
      auth.middleware.ts
      error.middleware.ts
      upload.middleware.ts
    config/
      database.ts
      env.ts
      logger.ts
    db/
      schema.sql
    types/
      index.ts
    app.ts
    server.ts
  package.json
  tsconfig.json
  Dockerfile
  Dockerfile.dev
```

---

## 실행 단계

### Step 1: 프로젝트 구조 및 설정 파일 생성
- [x] `packages/backend/package.json` — 의존성 정의
- [x] `packages/backend/tsconfig.json` — TypeScript 설정
- [x] `packages/backend/src/config/env.ts` — 환경 변수 로드 및 검증
- [x] `packages/backend/src/config/database.ts` — pg Pool 설정
- [x] `packages/backend/src/config/logger.ts` — Pino 로거 설정 (파일 + 콘솔)
- [x] `packages/backend/src/types/index.ts` — 공통 타입 정의
- **스토리**: 전체 공통 기반

### Step 2: DB 스키마 생성
- [x] `packages/backend/src/db/schema.sql` — 10개 테이블 DDL + 인덱스
- **스토리**: US-A00 (시스템 초기 설정 기반)

### Step 3: 미들웨어 생성
- [x] `packages/backend/src/middleware/auth.middleware.ts` — JWT 검증, 역할 기반 접근 제어
- [x] `packages/backend/src/middleware/error.middleware.ts` — 글로벌 에러 핸들러
- [x] `packages/backend/src/middleware/upload.middleware.ts` — Multer 이미지 업로드 설정
- **스토리**: US-A01, US-C01 (인증), US-A08 (이미지 업로드)

### Step 4: System 모듈 생성
- [x] `packages/backend/src/modules/system/system.repository.ts`
- [x] `packages/backend/src/modules/system/system.service.ts`
- **스토리**: US-A00 (시스템 초기 설정)

### Step 5: Auth 모듈 생성
- [x] `packages/backend/src/modules/auth/auth.repository.ts`
- [x] `packages/backend/src/modules/auth/auth.service.ts`
- [x] `packages/backend/src/modules/auth/auth.controller.ts`
- [x] `packages/backend/src/modules/auth/auth.routes.ts`
- **스토리**: US-A01 (관리자 로그인), US-C01 (테이블 인증)

### Step 6: Menu 모듈 생성
- [x] `packages/backend/src/modules/menu/menu.repository.ts`
- [x] `packages/backend/src/modules/menu/menu.service.ts`
- [x] `packages/backend/src/modules/menu/menu.controller.ts`
- [x] `packages/backend/src/modules/menu/menu.routes.ts`
- **스토리**: US-C02 (메뉴 조회), US-A08 (메뉴/카테고리 CRUD)

### Step 7: Order 모듈 생성
- [x] `packages/backend/src/modules/order/order.repository.ts`
- [x] `packages/backend/src/modules/order/order.service.ts`
- [x] `packages/backend/src/modules/order/order.controller.ts`
- [x] `packages/backend/src/modules/order/order.routes.ts`
- **스토리**: US-C04 (주문 생성), US-C05 (주문 내역), US-A02 (주문 모니터링), US-A05 (주문 삭제)

### Step 8: Realtime 모듈 생성
- [x] `packages/backend/src/modules/realtime/realtime.service.ts`
- [x] `packages/backend/src/modules/realtime/realtime.controller.ts`
- [x] `packages/backend/src/modules/realtime/realtime.routes.ts`
- **스토리**: US-A03 (실시간 알림), US-C06 (고객 실시간 업데이트)

### Step 9: Table 모듈 생성
- [x] `packages/backend/src/modules/table/table.repository.ts`
- [x] `packages/backend/src/modules/table/table.service.ts`
- [x] `packages/backend/src/modules/table/table.controller.ts`
- [x] `packages/backend/src/modules/table/table.routes.ts`
- **스토리**: US-A04 (테이블 설정), US-A06 (세션 종료), US-A07 (과거 내역), US-A09 (테이블 목록)

### Step 10: 앱 엔트리포인트 및 서버 생성
- [x] `packages/backend/src/app.ts` — Express 앱 설정, 라우트 등록, 미들웨어 적용
- [x] `packages/backend/src/server.ts` — 서버 시작, DB 연결, 시스템 초기화
- **스토리**: 전체 통합

### Step 11: 배포 아티팩트 생성
- [x] `packages/backend/Dockerfile` — 프로덕션 Multi-stage 빌드
- [x] `packages/backend/Dockerfile.dev` — 개발용 (핫 리로드)
- [x] `docker-compose.yml` — 전체 서비스 오케스트레이션
- [x] `docker-compose.dev.yml` — 개발 환경 오버라이드
- [x] `nginx/default.conf` — Nginx 리버스 프록시 설정
- [x] `nginx/nginx.conf` — Nginx 메인 설정
- [x] `.env.example` — 환경 변수 템플릿
- [x] `.gitignore` — Git 제외 파일 목록
- [x] `packages/backend/.gitignore` — Backend 전용 제외 파일
- **스토리**: 인프라 설계 기반

### Step 12: 문서 생성
- [x] `aidlc-docs/construction/backend/code/code-generation-summary.md` — 코드 생성 요약

---

## 스토리 추적

| Story | Step | 상태 |
|-------|------|------|
| US-A00 | Step 2, 4 | [x] |
| US-A01 | Step 3, 5 | [x] |
| US-A02 | Step 7 | [x] |
| US-A03 | Step 8 | [x] |
| US-A04 | Step 9 | [x] |
| US-A05 | Step 7 | [x] |
| US-A06 | Step 9 | [x] |
| US-A07 | Step 9 | [x] |
| US-A08 | Step 3, 6 | [x] |
| US-A09 | Step 9 | [x] |
| US-C01 | Step 3, 5 | [x] |
| US-C02 | Step 6 | [x] |
| US-C04 | Step 7 | [x] |
| US-C05 | Step 7 | [x] |
| US-C06 | Step 8 | [x] |
