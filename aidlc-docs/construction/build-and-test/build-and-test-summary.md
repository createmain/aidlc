# 빌드 및 테스트 요약

---

## 빌드 상태

| 항목 | 값 |
|------|-----|
| 빌드 도구 | nerdctl compose + TypeScript (tsc) + Vite |
| 빌드 방식 | Multi-stage Containerfile (Backend, Frontend) |
| 빌드 명령어 | `nerdctl compose up -d --build` |
| 빌드 아티팩트 | 컨테이너 이미지 4개 (frontend-init, backend, postgres, nginx) |
| 빌드 상태 | 준비 완료 (사용자 실행 필요) |

---

## 서비스 구성

| 서비스 | 이미지 | 포트 | 역할 | 헬스체크 |
|--------|--------|------|------|----------|
| postgres | postgres:16-alpine | 5432 (내부) | 데이터베이스 | pg_isready |
| backend | 커스텀 (Node.js 20 Alpine) | 3000 (내부) | API 서버, SSE, 이미지 서빙 | /api/health |
| frontend-init | 커스텀 (Node.js 20 Alpine → Alpine) | - | 프론트엔드 빌드 → 볼륨 복사 후 종료 | service_completed_successfully |
| nginx | nginx:alpine | 80 (호스트) | 리버스 프록시, 정적 파일 서빙 | wget localhost:80 |

### 개발 환경 추가 서비스

| 서비스 | 이미지 | 포트 | 역할 |
|--------|--------|------|------|
| frontend-dev | 커스텀 (Node.js 20 Alpine) | 5173 (호스트) | Vite dev server (HMR) |

---

## 테스트 실행 요약

### 유닛 테스트
- 상태: 미구현 (MVP 단계)
- Backend: 테스트 전략 및 6개 모듈별 테스트 대상 정의 완료
- Frontend: 테스트 전략 및 Context/Hook/페이지/공통 컴포넌트별 테스트 대상 정의 완료
- 향후 Vitest + React Testing Library + MSW 기반 구현 권장
- 목표 커버리지: Backend 70% 이상, Frontend 65% 이상

### 통합 테스트 (Backend API)
- 상태: 수동 테스트 시나리오 6개 정의
- 시나리오 1: 시스템 초기화 및 관리자 로그인
- 시나리오 2: 메뉴/카테고리 CRUD
- 시나리오 3: 테이블 설정 및 고객 인증
- 시나리오 4: 주문 생성 → 상태 변경 → 실시간 알림 (SSE)
- 시나리오 5: 이용 완료 (세션 종료) 및 과거 내역
- 시나리오 6: 주문 삭제 (논리 삭제)

### E2E 테스트 (Frontend ↔ Backend)
- 상태: 수동 테스트 시나리오 6개 정의
- 시나리오 E1: 관리자 로그인 → 대시보드 접근
- 시나리오 E2: 관리자 메뉴/카테고리 관리
- 시나리오 E3: 관리자 테이블 설정 → 고객 메뉴 탐색
- 시나리오 E4: 고객 주문 → 관리자 실시간 수신 (SSE)
- 시나리오 E5: 관리자 주문 상태 변경 → 고객 실시간 수신 (SSE)
- 시나리오 E6: 이용 완료 → 과거 내역 조회
- 향후 Playwright 기반 자동화 권장

### 성능 테스트
- 상태: N/A (소규모 MVP, 10개 이하 테이블)
- 향후 필요 시 k6 또는 Artillery 기반 부하 테스트 권장

### 보안 테스트
- 상태: N/A (Security Extension 비활성화)
- JWT 인증 및 역할 기반 접근 제어는 통합 테스트에서 검증

---

## 생성된 문서

| 파일 | 설명 |
|------|------|
| build-instructions.md | 빌드 사전 요구사항, 환경 설정, 프로덕션/개발 빌드 명령어, 트러블슈팅 (Backend + Frontend) |
| unit-test-instructions.md | 유닛 테스트 전략, Backend 6개 모듈 + Frontend 컴포넌트별 테스트 대상, 커버리지 목표 |
| integration-test-instructions.md | Backend API 통합 테스트 시나리오 6개, curl 명령어 포함 |
| e2e-test-instructions.md | Frontend ↔ Backend E2E 테스트 시나리오 6개, 브라우저 기반 워크플로우 |
| build-and-test-summary.md | 전체 빌드/테스트 요약 (본 문서) |

---

## 전체 상태

| 항목 | 상태 |
|------|------|
| 빌드 (Backend) | ✅ 준비 완료 |
| 빌드 (Frontend) | ✅ 준비 완료 |
| 유닛 테스트 | ⏳ 전략 정의 (향후 구현) |
| 통합 테스트 (API) | ✅ 시나리오 정의 완료 |
| E2E 테스트 | ✅ 시나리오 정의 완료 |
| 성능 테스트 | N/A |
| 보안 테스트 | N/A |
| Operations 준비 | ✅ 가능 |

---

## 다음 단계

Backend + Frontend 유닛의 빌드 및 테스트 지침이 완료되었습니다.
- `nerdctl compose up -d --build`로 전체 서비스를 빌드/실행할 수 있습니다.
- 통합 테스트 시나리오 (curl)와 E2E 테스트 시나리오 (브라우저)를 수행할 수 있습니다.
- Operations 단계는 현재 플레이스홀더 상태입니다.
