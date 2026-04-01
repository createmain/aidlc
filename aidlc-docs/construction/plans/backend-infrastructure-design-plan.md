# Backend Infrastructure Design Plan

---

## 계획 개요

Backend 유닛의 논리적 소프트웨어 컴포넌트를 실제 인프라 서비스에 매핑합니다.

### 대상 컴포넌트
- Node.js API 서버 (Express/Fastify, 6개 도메인 모듈)
- PostgreSQL 데이터베이스 (10개 테이블)
- SSE 실시간 통신
- 이미지 파일 저장소
- Docker 컨테이너 배포

---

## 실행 단계

- [x] Step 1: 사용자 질문 수집 및 분석
- [x] Step 2: 인프라 설계 산출물 생성 (infrastructure-design.md)
- [x] Step 3: 배포 아키텍처 산출물 생성 (deployment-architecture.md)
- [x] Step 4: 사용자 승인

---

## 질문 (7개)

### Q1. 배포 환경 (Deployment Environment)
Docker 컨테이너 기반 배포로 결정되어 있습니다. 실행 환경을 선택해 주세요.

A) 로컬 머신 전용 (docker-compose만 사용, 외부 배포 없음)
B) 단일 VPS/서버 (docker-compose로 원격 서버 1대에 배포)
C) 클라우드 컨테이너 서비스 (AWS ECS, GCP Cloud Run 등)

[Answer]: A

---

### Q2. 데이터베이스 운영 방식 (Storage Infrastructure)
PostgreSQL 운영 방식을 선택해 주세요.

A) Docker 컨테이너 내 PostgreSQL (docker-compose에 포함, 볼륨 마운트로 데이터 영속화)
B) 관리형 DB 서비스 (AWS RDS, GCP Cloud SQL 등)
C) 호스트 머신에 직접 설치

[Answer]: A

---

### Q3. 이미지 파일 저장소 (Storage Infrastructure)
메뉴 이미지 파일 저장 방식을 선택해 주세요. 현재 설계는 서버 로컬 파일시스템(`uploads/images/`)입니다.

A) 컨테이너 내 로컬 파일시스템 + Docker 볼륨 마운트 (현재 설계 유지)
B) 외부 오브젝트 스토리지 (AWS S3, MinIO 등)

[Answer]: A

---

### Q4. 리버스 프록시 / 로드밸런서 (Networking Infrastructure)
프론트엔드와 백엔드 간 라우팅 및 HTTPS 처리 방식을 선택해 주세요.

A) Nginx 리버스 프록시 (docker-compose에 포함, 프론트엔드 정적 서빙 + 백엔드 API 프록시)
B) 별도 리버스 프록시 없음 (백엔드가 직접 프론트엔드 정적 파일 서빙)
C) 클라우드 로드밸런서 (ALB, Cloud Load Balancing 등)

[Answer]: A

---

### Q5. 환경 변수 및 시크릿 관리 (Shared Infrastructure)
JWT 시크릿, DB 접속 정보 등 민감 정보 관리 방식을 선택해 주세요.

A) .env 파일 (docker-compose에서 env_file로 참조, .gitignore에 추가)
B) Docker secrets
C) 클라우드 시크릿 매니저 (AWS Secrets Manager 등)

[Answer]: A

---

### Q6. 로깅 및 모니터링 (Monitoring Infrastructure)
MVP 수준의 로깅/모니터링 방식을 선택해 주세요.

A) 콘솔 로그만 (stdout/stderr, docker logs로 확인)
B) 파일 로그 (Winston/Pino → 로그 파일, Docker 볼륨 마운트)
C) 로그 수집 스택 (ELK, Loki+Grafana 등)

[Answer]: B

---

### Q7. 컨테이너 헬스체크 및 재시작 정책 (Compute Infrastructure)
컨테이너 장애 시 복구 방식을 선택해 주세요.

A) docker-compose restart 정책만 (restart: unless-stopped + healthcheck)
B) 별도 오케스트레이션 없음 (수동 재시작)

[Answer]: A

---
