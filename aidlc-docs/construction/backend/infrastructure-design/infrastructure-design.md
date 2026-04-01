# Backend - 인프라 설계

---

## 1. 인프라 개요

| 항목 | 결정 |
|------|------|
| 배포 환경 | 로컬 머신 전용 (docker-compose) |
| 컴퓨트 | Docker 컨테이너 (Node.js API 서버) |
| 데이터베이스 | Docker 컨테이너 내 PostgreSQL 16 |
| 프론트엔드 배포 | Init 컨테이너 (frontend-init) → Named Volume |
| 파일 저장소 | 로컬 파일시스템 + Docker Named Volume |
| 네트워킹 | Nginx 리버스 프록시 (docker-compose 내) |
| 시크릿 관리 | .env 파일 (docker-compose env_file) |
| 로깅 | Pino → 파일 로그 (Docker Volume 마운트) |
| 복구 정책 | docker-compose restart: unless-stopped + healthcheck |

---

## 2. 컨테이너 구성

### 2.1 서비스 목록

| 서비스명 | 이미지 | 포트 | 역할 |
|----------|--------|------|------|
| frontend-init | 커스텀 (Node.js 20 Alpine, multi-stage) | - | 프론트엔드 빌드 → frontend-build 볼륨에 결과물 복사 후 종료 |
| nginx | nginx:alpine | 80 (호스트) | 리버스 프록시, 프론트엔드 정적 서빙 |
| backend | 커스텀 (Node.js 20 Alpine) | 3000 (내부) | API 서버, SSE, 이미지 서빙 |
| postgres | postgres:16-alpine | 5432 (내부) | 데이터베이스 |

### 2.2 컨테이너 간 통신

```
[클라이언트 브라우저]
        |
        | :80
        v
+---------------+
|    nginx      |  리버스 프록시
+---------------+
   |          |
   |          | /api/*, /uploads/*
   |          v
   |   +---------------+
   |   |   backend     |  :3000
   |   +---------------+
   |          |
   |          | :5432
   |          v
   |   +---------------+
   |   |   postgres    |
   |   +---------------+
   |
   | /* (정적 파일)
   v
[프론트엔드 빌드 결과물]
(frontend-build 볼륨, frontend-init 컨테이너가 빌드 후 복사)
```

### 텍스트 대안
```
frontend-init (빌드 후 종료) → frontend-build 볼륨에 결과물 복사
클라이언트 → nginx(:80)
  ├─ /api/*, /uploads/* → backend(:3000) → postgres(:5432)
  └─ /* (정적 파일) → nginx 내부 서빙 (frontend-build 볼륨)
```

---

## 3. 컴퓨트 인프라 (backend 컨테이너)

### 3.1 베이스 이미지
- `node:20-alpine` (빌드 스테이지 + 런타임 스테이지 분리)
- Multi-stage Dockerfile로 빌드 산출물만 런타임에 포함
- 빌드 스테이지에서 `python3`, `make`, `g++` 설치 (bcrypt 네이티브 모듈 빌드용)

### 3.2 리소스 제한
- MVP 수준이므로 docker-compose에서 별도 리소스 제한 미설정
- 필요 시 `deploy.resources.limits`로 CPU/메모리 제한 추가 가능

### 3.3 헬스체크
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 15s
```

### 3.4 재시작 정책
```yaml
restart: unless-stopped
```

### 3.5 헬스체크 엔드포인트
- `GET /api/health` → 200 OK (DB 연결 확인 포함)
- 응답: `{ "status": "ok", "db": "connected" }`

---

## 4. 스토리지 인프라

### 4.1 PostgreSQL

| 항목 | 값 |
|------|-----|
| 이미지 | postgres:16-alpine |
| 포트 | 5432 (내부 네트워크만 노출) |
| 데이터 영속화 | Docker Named Volume (`pgdata`) |
| 초기화 | `/docker-entrypoint-initdb.d/` 에 schema.sql 마운트 |
| 인코딩 | UTF-8 |

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 10s
```

### 4.2 이미지 파일 저장소

| 항목 | 값 |
|------|-----|
| 저장 경로 (컨테이너 내) | `/app/uploads/images/` |
| Docker Volume | Named Volume (`uploads`) → `/app/uploads` |
| 서빙 경로 | `/uploads/images/**` (nginx가 backend로 프록시) |
| 파일 구조 | `uploads/images/{categoryName}/{uuid}.{ext}` |

### 4.3 로그 파일 저장소

| 항목 | 값 |
|------|-----|
| 저장 경로 (컨테이너 내) | `/app/logs/` |
| Docker Volume | Named Volume (`logs`) → `/app/logs` |
| 로그 라이브러리 | Pino |
| 로그 파일 | `app.log` (일반), `error.log` (에러) |
| 로테이션 | pino-roll (코드 레벨, 일별 로테이션, 7일 보관) |

---

## 5. 네트워킹 인프라 (Nginx)

### 5.1 Nginx 설정 개요

| 항목 | 값 |
|------|-----|
| 이미지 | nginx:alpine |
| 호스트 포트 | 80 |
| 프론트엔드 서빙 | `/usr/share/nginx/html/` (빌드 결과물 복사) |
| API 프록시 | `/api/*` → `http://backend:3000` |
| 이미지 프록시 | `/uploads/*` → `http://backend:3000` |
| SSE 프록시 | `/api/realtime/*` → `http://backend:3000` (버퍼링 비활성화) |

### 5.2 라우팅 규칙

```
location /api/realtime/subscribe/customer {
    proxy_pass http://backend:3000;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding off;
    proxy_read_timeout 86400s;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /api/realtime/ {
    proxy_pass http://backend:3000;
    proxy_set_header Connection '';
    proxy_http_version 1.1;
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding off;
    proxy_read_timeout 86400s;
}

location /api/ {
    proxy_pass http://backend:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location /uploads/ {
    proxy_pass http://backend:3000;
}

location / {
    root /usr/share/nginx/html;
    try_files $uri $uri/ /index.html;
}
```

### 5.3 SSE 프록시 주의사항
- `proxy_buffering off` 필수 (SSE 이벤트 즉시 전달)
- `proxy_read_timeout` 충분히 길게 설정 (24시간)
- `chunked_transfer_encoding off` 설정
- 관리자 SSE (`/api/realtime/subscribe`)와 고객 SSE (`/api/realtime/subscribe/customer`) 모두 동일한 SSE 프록시 설정 적용
- nginx location 블록 순서: 더 구체적인 경로(`/api/realtime/subscribe/customer`)를 먼저 배치

### 5.4 헬스체크
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## 6. 시크릿 및 환경 변수 관리

### 6.1 .env 파일 구조

```env
# Database
POSTGRES_USER=tableorder
POSTGRES_PASSWORD=<secure_password>
POSTGRES_DB=tableorder

# Backend
DATABASE_URL=postgresql://tableorder:<secure_password>@postgres:5432/tableorder
JWT_SECRET=<secure_random_string>
JWT_EXPIRES_IN=16h
NODE_ENV=production
PORT=3000
TZ=Asia/Seoul

# PostgreSQL Timezone
PGTZ=Asia/Seoul

# Logging
LOG_LEVEL=info
LOG_DIR=/app/logs
```

### 6.2 보안 규칙
- `.env` 파일은 `.gitignore`에 반드시 추가
- `.env.example` 파일을 제공하여 필요한 변수 목록 문서화 (값은 플레이스홀더)
- 프로덕션 배포 시 강력한 비밀번호/시크릿 사용

### 6.3 타임존 설정
- 모든 컨테이너에 `TZ=Asia/Seoul` 환경변수 적용 (한국 시간 기준)
- PostgreSQL에 `PGTZ=Asia/Seoul` 추가 설정 → DB 내 `NOW()` 함수가 한국 시간 반환
- 주문 번호 생성(`ORD-{YYYYMMDD}-{순번}`)의 날짜 부분이 한국 시간 기준으로 동작
- Node.js 애플리케이션에서도 `TZ=Asia/Seoul`로 `new Date()`가 한국 시간 기준

---

## 7. 로깅 인프라

### 7.1 Pino 로거 설정

| 항목 | 값 |
|------|-----|
| 라이브러리 | pino + pino-roll |
| 로그 레벨 | info (환경 변수로 조정 가능) |
| 출력 형식 | JSON (구조화 로그) |
| 파일 출력 | `/app/logs/app.log` |
| 에러 전용 | `/app/logs/error.log` (level >= error) |
| 로테이션 방식 | pino-roll (코드 레벨, 일별 로테이션, 7일 보관) |
| 콘솔 출력 | 개발 환경에서만 (pino-pretty) |

> 로그 로테이션은 코드 레벨에서 pino-roll로 처리합니다. 컨테이너 내 logrotate 등 OS 레벨 도구는 사용하지 않습니다.

### 7.2 로그 항목
- HTTP 요청/응답 (method, url, status, duration)
- 비즈니스 이벤트 (주문 생성, 상태 변경, 세션 완료 등)
- 에러 (스택 트레이스 포함)
- 시스템 이벤트 (서버 시작, DB 연결, 초기화)

---

## 8. Docker 네트워크

### 8.1 네트워크 구성

| 네트워크 | 타입 | 참여 서비스 |
|----------|------|-------------|
| tableorder-net | bridge | frontend-init, nginx, backend, postgres |

- 모든 서비스가 동일 bridge 네트워크에 참여 (frontend-init은 빌드 완료 후 종료)
- 서비스 간 통신은 서비스명으로 DNS 해석 (예: `postgres:5432`, `backend:3000`)
- 외부 노출 포트: nginx의 80번만

---

## 9. Docker Volumes

| Volume 이름 | 마운트 경로 | 용도 |
|-------------|-------------|------|
| pgdata | /var/lib/postgresql/data | PostgreSQL 데이터 영속화 |
| uploads | /app/uploads | 메뉴 이미지 파일 영속화 |
| logs | /app/logs | 애플리케이션 로그 파일 영속화 |
| frontend-build | /usr/share/nginx/html (nginx), /output (frontend-init) | 프론트엔드 빌드 결과물 공유 |
