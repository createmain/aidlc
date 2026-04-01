# Frontend Functional Design Plan

## 유닛 컨텍스트 요약
- **유닛**: Frontend (단일 React 앱, 라우팅 분리)
- **기술 스택**: React + TypeScript, MUI (Material UI), styled-components
- **범위**: Customer UI (`/customer/*`) + Admin UI (`/admin/*`) + Shared Components
- **할당 스토리**: 15개 (US-C01~C06, US-A01~A09, US-A00 제외)
- **API 참조**: `aidlc-docs/construction/backend/functional-design/api-specification.md`

## 실행 계획

### Part 1: 질문 수집
- [x] Step 1: 유닛 컨텍스트 분석
- [x] Step 2: 질문 파일 생성 및 사용자 답변 수집 (이전 세션 답변 재활용)
- [x] Step 3: 답변 분석 및 모호성 확인

### Part 2: 산출물 생성
- [x] Step 4: `frontend-components.md` — 컴포넌트 계층 구조, Props/State 정의
- [x] Step 5: `business-logic-model.md` — 프론트엔드 비즈니스 로직
- [x] Step 6: `business-rules.md` — 폼 검증, 상태 전이, UI 제약 규칙
- [x] Step 7: `domain-entities.md` — 프론트엔드 데이터 모델 (API 스펙 기반)
- [ ] Step 8: 승인 요청
