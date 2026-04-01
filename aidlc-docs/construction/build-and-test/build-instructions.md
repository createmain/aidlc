# 빌드 지침

---

## 1. 사전 요구사항

| 항목 | 최소 버전 | 확인 명령어 |
|------|-----------|-------------|
| nerdctl | 1.x | `nerdctl --version` |
| nerdctl compose | 내장 | `nerdctl compose version` |
| Node.js | 20.x (로컬 개발 시) | `node --version` |
| npm | 10.x (로컬 개발 시) | `npm --version` |
| 디스크 공간 | 2GB 이상 | - |
| 메모리 | 4GB 이상 | - |

---

## 2. 환경 변수 설정

```bash
# .env.example을 복사하여 .env 생성
cp .env.example .env

# .env 파일을 편집하여 실제 값 설정
# 필수 변경 항목:
#   POSTGRES_PASSWORD — 안전한 비밀번호로 변경
#   JWT_SECRET — 랜덤 문자열로 변경
#   DATABASE_URL — POSTGRES_PASSWORD와 동일하게 맞춤
```

### .env 필수 항목 (Backend + DB)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| POSTGRES_USER | DB 사용자명 | tableorder |
| POSTGRES_PASSWORD | DB 비밀번호 | (변경 필수) |
| POSTGRES_DB | DB 이름 | tableorder |
| DATABASE_URL | PostgreSQL 연결 문자열 | (POSTGRES_PASSWORD와 동기화) |
| JWT_SECRET | JWT 서명 키 | (변경 필수) |
| JWT_EXPIRES_IN | JWT 만료 시간 | 16h |
| NODE_ENV | 실행 환경 | production |
| PORT | 백엔드 포트 | 3000 |
| TZ | 타임존 | Asia/Seoul |
| LOG_LEVEL | 로그 레벨 | info |
| LOG_DIR | 로그 디렉토리 | /app/logs |

### Frontend 환경 변수 (packages/frontend/.env)

| 변수 | 설명 | 기본값 |
|------|------|--------|
| VITE_API_BASE_URL | API 기본 경로 | /api |
| VITE_UPLOADS_BASE_URL | 이미지 업로드 경로 | /uploads |

> Frontend 환경 변수는 Vite 빌드 시 정적으로 번들에 포함됩니다. 런타임 변경 불가.

---

## 3. 프로덕션 빌드 및 실행

### 3.1 전체 서비스 시작
```bash
# 컨테이너 이미지 빌드 + 서비스 시작
nerdctl compose up -d --build
```

### 3.2 시작 순서 (자동)
```
1. postgres → pg_isready 헬스체크 통과 대기
2. backend → DB 연결 + 시스템 초기화 → /api/health 헬스체크 통과 대기
3. frontend-init → npm ci + tsc + vite build → dist/* 를 frontend-build 볼륨에 복사 → 완료 후 종료
4. nginx → frontend-init 완료(service_completed_successfully) + backend healthy 확인 후 트래픽 수신
```

### 3.3 빌드 성공 확인
```bash
# 모든 서비스 상태 확인
nerdctl compose ps

# 기대 결과:
#   frontend-init — exited (0)  ← 정상 종료
#   nginx         — running (healthy)
#   backend       — running (healthy)
#   postgres      — running (healthy)
```

### 3.4 헬스체크 확인
```bash
# Backend API 헬스체크
curl http://localhost/api/health
# 기대 응답: {"status":"ok","db":"connected"}

# Frontend 정적 파일 서빙 확인
curl -s -o /dev/null -w "%{http_code}" http://localhost/
# 기대: 200
```

---

## 4. 개발 환경 빌드 및 실행

### 4.1 개발 환경 시작
```bash
# 개발용 오버라이드 적용
nerdctl compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### 4.2 개발 환경 특이사항
- Frontend: Vite dev server (포트 5173) — 소스 코드 바인드 마운트, HMR 지원
- Backend: tsx watch 모드 — 소스 코드 바인드 마운트, 코드 변경 시 자동 재시작
- PostgreSQL 포트 5432 호스트 노출 → DB 클라이언트 직접 접속 가능
- Backend 포트 3000 호스트 노출 → nginx 없이 직접 API 테스트 가능
- Frontend Vite dev server가 /api, /uploads 요청을 backend:3000으로 프록시
- 로그 레벨 debug, 콘솔 출력 활성화

### 4.3 개발 환경 접속 URL
| 서비스 | URL | 비고 |
|--------|-----|------|
| Frontend (Vite) | http://localhost:5173 | HMR 지원, API 프록시 내장 |
| Backend (직접) | http://localhost:3000 | API 직접 테스트용 |
| PostgreSQL | localhost:5432 | DB 클라이언트 접속용 |

### 4.4 로컬 개발 (컨테이너 없이)

#### Backend
```bash
cd packages/backend
npm install
npm run build
npm run dev
```
> PostgreSQL이 별도로 실행 중이어야 하며, DATABASE_URL을 로컬 DB에 맞게 조정해야 합니다.

#### Frontend
```bash
cd packages/frontend
npm install
npm run dev
```
> Vite dev server가 5173 포트에서 시작됩니다. vite.config.ts의 proxy 설정으로 /api, /uploads 요청이 localhost:3000으로 프록시됩니다.

---

## 5. 서비스 관리 명령어

### 5.1 서비스 중지/재시작
```bash
# 전체 중지
nerdctl compose down

# 전체 중지 + 볼륨 삭제 (데이터 초기화)
nerdctl compose down -v

# 특정 서비스 재시작
nerdctl compose restart backend

# Frontend만 재빌드
nerdctl compose up -d --build frontend-init
nerdctl compose restart nginx
```

### 5.2 로그 확인
```bash
# 전체 로그
nerdctl compose logs -f

# Backend 로그만
nerdctl compose logs -f backend

# Frontend 빌드 로그 확인
nerdctl compose logs frontend-init

# 파일 로그 확인
nerdctl compose exec backend cat /app/logs/app.log
nerdctl compose exec backend cat /app/logs/error.log
```

### 5.3 데이터베이스 관리
```bash
# DB 접속
nerdctl compose exec postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB}

# DB 백업
nerdctl compose exec postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > backup.sql

# DB 복원
nerdctl compose exec -T postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB} < backup.sql
```

---

## 6. 트러블슈팅

### 6.1 빌드 실패: bcrypt 네이티브 모듈 (Backend)
- 원인: Alpine Linux에서 bcrypt 빌드 시 python3, make, g++ 필요
- 해결: Dockerfile 빌드 스테이지에 이미 포함됨. 빌드 캐시 문제 시 `nerdctl compose build --no-cache backend`

### 6.2 DB 연결 실패
- 원인: postgres 컨테이너 미시작 또는 .env 설정 불일치
- 해결: `nerdctl compose ps`로 postgres 상태 확인, .env의 DATABASE_URL과 POSTGRES_* 변수 일치 확인

### 6.3 포트 충돌
- 원인: 80번 또는 5432번 포트가 이미 사용 중
- 해결: `lsof -i :80` 또는 `lsof -i :5432`로 확인 후 충돌 프로세스 종료, 또는 docker-compose.yml에서 포트 변경

### 6.4 스키마 초기화 미실행
- 원인: pgdata 볼륨에 이미 데이터가 존재하면 initdb.d 스크립트 미실행
- 해결: `nerdctl compose down -v`로 볼륨 삭제 후 재시작

### 6.5 Frontend 빌드 실패: TypeScript 에러
- 원인: 타입 에러 또는 import 경로 오류
- 해결: 로컬에서 `cd packages/frontend && npm run build`로 에러 확인 후 수정. 또는 `nerdctl compose logs frontend-init`으로 빌드 로그 확인

### 6.6 Frontend 빌드 성공했으나 페이지 표시 안 됨
- 원인: frontend-build 볼륨에 이전 빌드 결과물이 남아있거나, nginx가 볼륨을 읽지 못함
- 해결: `nerdctl compose down -v`로 볼륨 초기화 후 재빌드, 또는 `nerdctl compose exec nginx ls /usr/share/nginx/html/`로 파일 존재 확인

### 6.7 개발 환경에서 Frontend HMR 미동작
- 원인: Docker 컨테이너 내 파일 변경 감지 이슈
- 해결: Vite의 `server.watch.usePolling` 옵션 활성화, 또는 컨테이너 없이 로컬에서 `npm run dev` 실행 권장
