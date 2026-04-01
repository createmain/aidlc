# Frontend Infrastructure Design 질문

아래 질문에 답변해 주세요. 각 질문의 [Answer]: 태그 뒤에 선택지 문자를 입력해 주세요.

---

## Question 1
Frontend 정적 파일 서빙 방식을 어떻게 할까요?

A) Nginx 컨테이너 — React 빌드 결과물을 Nginx로 서빙 (별도 컨테이너)
B) Backend 서버에서 서빙 — Express/Fastify의 static middleware로 빌드 결과물 서빙 (단일 컨테이너)
C) 개발 서버 그대로 — Vite dev server를 Docker로 실행 (개발 전용)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 2
Frontend 빌드 도구를 어떻게 할까요?

A) Vite (빠른 빌드, React + TypeScript 기본 지원)
B) Create React App (CRA)
C) Webpack 직접 설정
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
Frontend와 Backend 간 API 프록시를 어떻게 처리할까요? (CORS 해결 방식)

A) Nginx 리버스 프록시 — Nginx에서 /api/* 요청을 Backend 컨테이너로 프록시
B) Backend CORS 설정 — Backend에서 Frontend 도메인 허용 (별도 프록시 없음)
C) docker-compose 네트워크 + Vite proxy — 개발 시 Vite proxy, 프로덕션 시 Nginx 프록시
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
Frontend Docker 이미지 빌드 전략을 어떻게 할까요?

A) Multi-stage build — Stage 1: Node로 빌드, Stage 2: Nginx로 서빙 (경량 이미지)
B) 단일 Node 이미지 — Node 이미지에서 빌드 + serve 패키지로 서빙
C) 빌드 결과물만 복사 — 호스트에서 빌드 후 Nginx 이미지에 COPY
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 5
Frontend 환경 변수 관리를 어떻게 할까요? (API URL 등)

A) 빌드 시 주입 — .env 파일 + Vite의 VITE_ 접두사 환경 변수 (빌드 시 고정)
B) 런타임 주입 — window.__ENV__ 전역 변수로 Nginx 서빙 시 동적 주입
C) docker-compose 환경 변수 — 빌드 시 ARG로 전달
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
Frontend 컨테이너의 포트 구성을 어떻게 할까요?

A) Frontend: 80 (Nginx), Backend: 3000 — docker-compose에서 호스트 포트 매핑
B) Frontend: 3000, Backend: 3001 — 둘 다 Node 기반 포트
C) 단일 진입점 — Nginx가 80 포트에서 Frontend + Backend 프록시 (통합 게이트웨이)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

