# 테이블오더 서비스 - Story-Unit 매핑

---

## Unit 1: Backend — 스토리 매핑

| Story | 제목 | Priority | Backend 관련 범위 |
|-------|------|----------|-------------------|
| US-A00 | 시스템 초기 설정 | Must | System 모듈 — 관리자 계정 자동 생성, 중복 방지 |
| US-A01 | 매장 인증 (로그인) | Must | Auth 모듈 — JWT 발급, 토큰 검증, 로그인 시도 제한 |
| US-C01 | 테이블 태블릿 자동 로그인 | Must | Auth 모듈 — 테이블 인증 API, 세션 토큰 발급 |
| US-C02 | 메뉴 조회 및 탐색 | Must | Menu 모듈 — 메뉴/카테고리 조회 API |
| US-A08 | 메뉴 및 카테고리 관리 (CRUD) | Must | Menu 모듈 — 메뉴/카테고리 CRUD API, 이미지 업로드 |
| US-C04 | 주문 생성 | Must | Order 모듈 — 주문 생성 API, 세션 자동 시작 연동 |
| US-C05 | 주문 내역 조회 | Must | Order 모듈 — 세션별 주문 조회 API |
| US-A02 | 실시간 주문 모니터링 | Must | Order 모듈 — 테이블별 주문 조회, 상태 변경 API |
| US-A03 | 실시간 신규 주문 알림 | Must | Realtime 모듈 — SSE 연결, 이벤트 브로드캐스트 |
| US-A04 | 테이블 초기 설정 | Must | Table 모듈 — 테이블 설정 API, 세션 생성 |
| US-A05 | 주문 삭제 | Must | Order 모듈 — 주문 삭제 API, 총액 재계산 |
| US-A06 | 테이블 세션 종료 | Must | Table 모듈 — 이용 완료 API, 이력 이동 |
| US-A07 | 과거 주문 내역 조회 | Must | Table 모듈 — 과거 이력 조회 API, 날짜 필터 |
| US-A09 | 테이블 목록 조회 및 관리 | Must | Table 모듈 — 테이블 목록 조회 API, 테이블 상태 조회 API |
| US-C06 | 주문 상태 실시간 업데이트 | Could | Realtime 모듈 — 고객용 SSE 엔드포인트 (선택) |

---

## Unit 2: Frontend — 스토리 매핑

| Story | 제목 | Priority | Frontend 관련 범위 |
|-------|------|----------|-------------------|
| US-C01 | 테이블 태블릿 자동 로그인 | Must | Customer UI — 자동 로그인, 인증 정보 로컬 저장 |
| US-C02 | 메뉴 조회 및 탐색 | Must | Customer UI — 카테고리별 메뉴 카드, 상세 보기 |
| US-C03 | 장바구니 관리 | Must | Customer UI — localStorage 장바구니, 수량 조절, 총액 |
| US-C04 | 주문 생성 | Must | Customer UI — 주문 확인/확정, 성공/실패 처리 |
| US-C05 | 주문 내역 조회 | Must | Customer UI — 세션 주문 목록, 페이지네이션 |
| US-C06 | 주문 상태 실시간 업데이트 | Could | Customer UI — SSE 수신, 상태 실시간 반영 (선택) |
| US-A00 | 시스템 초기 설정 | Must | (Frontend 해당 없음 — 서버 자동 실행) |
| US-A01 | 매장 인증 (로그인) | Must | Admin UI — 로그인 폼, JWT 저장, 세션 유지 |
| US-A02 | 실시간 주문 모니터링 | Must | Admin UI — 대시보드 그리드, 테이블 카드, 상태 변경 |
| US-A03 | 실시간 신규 주문 알림 | Must | Admin UI — SSE 수신, 신규 주문 시각적 강조 |
| US-A04 | 테이블 초기 설정 | Must | Admin UI — 테이블 설정 폼 |
| US-A05 | 주문 삭제 | Must | Admin UI — 삭제 확인 팝업, 성공/실패 피드백 |
| US-A06 | 테이블 세션 종료 | Must | Admin UI — 이용 완료 확인 팝업, 성공/실패 피드백 |
| US-A07 | 과거 주문 내역 조회 | Must | Admin UI — 과거 이력 목록, 날짜 필터, 닫기 버튼 |
| US-A08 | 메뉴 및 카테고리 관리 (CRUD) | Must | Admin UI — 메뉴/카테고리 CRUD 폼, 이미지 업로드 |
| US-A09 | 테이블 목록 조회 및 관리 | Must | Admin UI — 테이블 목록 화면, 테이블 상세 상태 표시 |

---

## 스토리 할당 검증

### 전체 스토리 목록 (16개)

| Story | Backend | Frontend | 검증 |
|-------|:-------:|:--------:|:----:|
| US-A00 | ✅ | - | ✅ (서버 전용) |
| US-A01 | ✅ | ✅ | ✅ |
| US-A02 | ✅ | ✅ | ✅ |
| US-A03 | ✅ | ✅ | ✅ |
| US-A04 | ✅ | ✅ | ✅ |
| US-A05 | ✅ | ✅ | ✅ |
| US-A06 | ✅ | ✅ | ✅ |
| US-A07 | ✅ | ✅ | ✅ |
| US-A08 | ✅ | ✅ | ✅ |
| US-A09 | ✅ | ✅ | ✅ |
| US-C01 | ✅ | ✅ | ✅ |
| US-C02 | ✅ | ✅ | ✅ |
| US-C03 | - | ✅ | ✅ (클라이언트 전용) |
| US-C04 | ✅ | ✅ | ✅ |
| US-C05 | ✅ | ✅ | ✅ |
| US-C06 | ✅ | ✅ | ✅ |

- 누락 스토리: **0개** — 전체 16개 스토리 모두 할당 완료
- US-A00: Backend 전용 (시스템 초기화, Frontend 해당 없음)
- US-C03: Frontend 전용 (localStorage 장바구니, Backend 해당 없음)
