# Backend - 배포 아키텍처

---

## 1. docker-compose.yml 구조

```yaml
version: '3.8'

services:
  frontend-init:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile.build
    volumes:
      - frontend-build:/output
    entrypoint: ["sh", "-c", "cp -r /app/dist/* /output/"]
    restart: "no"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - frontend-build:/usr/share/nginx/html:ro
    depends_on:
      frontend-init:
        condition: service_completed_successfully
      backend:
        condition: service_healthy
    environment:
      - TZ=Asia/Seoul
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - tableorder-net

  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
    expose:
      - "3000"
    env_file:
      - .env
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    networks:
      - tableorder-net

  postgres:
    image: postgres:16-alpine
    env_file:
      - .env
    environment:
      - TZ=Asia/Seoul
      - PGTZ=Asia/Seoul
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./packages/backend/src/db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql:ro
    expose:
      - "5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - tableorder-net

volumes:
  pgdata:
  uploads:
  logs:
  frontend-build:

networks:
  tableorder-net:
    driver: bridge
```

---

## 2. Backend Dockerfile (Multi-stage)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache wget
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
RUN mkdir -p /app/uploads/images /app/logs
ENV TZ=Asia/Seoul
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

---

## 3. 서비스 시작 순서 및 의존성

```
postgres (healthcheck: pg_isready)
    |
    v
backend (depends_on: postgres healthy)
    |  (healthcheck: /api/health)
    v
frontend-init (빌드 후 결과물을 frontend-build 볼륨에 복사, 완료 후 종료)
    |
    v
nginx (depends_on: frontend-init completed + backend healthy)
```

### 텍스트 대안
```
1. postgres 시작 → pg_isready 헬스체크 통과 대기
2. backend 시작 → DB 연결 확인 + 시스템 초기화 → /api/health 헬스체크 통과 대기
3. frontend-init 시작 → 프론트엔드 빌드 결과물을 frontend-build 볼륨에 복사 → 완료 후 종료
4. nginx 시작 → frontend-init 완료 + backend healthy 확인 후 트래픽 수신
```

---

## 4. 데이터 영속화 전략

| 데이터 | Volume | 백업 방식 |
|--------|--------|-----------|
| PostgreSQL | pgdata | `docker exec postgres pg_dump` → 로컬 파일 |
| 이미지 파일 | uploads | 호스트 파일시스템 복사 또는 tar 아카이브 |
| 로그 파일 | logs | 호스트에서 직접 접근 (7일 자동 로테이션) |

---

## 5. 개발 환경 구성

### 5.1 docker-compose.dev.yml (개발용 오버라이드)

```yaml
version: '3.8'

services:
  frontend-dev:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ./packages/frontend/src:/app/src
      - ./packages/frontend/index.html:/app/index.html
    environment:
      - VITE_API_BASE_URL=/api
      - VITE_UPLOADS_BASE_URL=/uploads
    networks:
      - tableorder-net

  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./packages/backend/src:/app/src
      - uploads:/app/uploads
      - logs:/app/logs
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    ports:
      - "3000:3000"

  postgres:
    ports:
      - "5432:5432"
```

### 5.2 개발 환경 특이사항
- Frontend: Vite dev server (포트 5173) — 소스 코드 바인드 마운트, HMR 지원
- Backend: tsx watch 모드 — 소스 코드 바인드 마운트, 코드 변경 시 자동 재시작
- postgres 포트 호스트 노출 (DB 클라이언트 직접 접속용)
- backend 포트 호스트 노출 (nginx 없이 직접 API 테스트)
- Frontend Vite dev server가 /api, /uploads 요청을 backend:3000으로 프록시
- 로그 레벨 debug, 콘솔 출력 활성화 (pino-pretty)

---

## 6. 프론트엔드 빌드 결과물 배포

### 6.1 빌드 및 배포 흐름

```
1. packages/frontend/ 에서 npm run build
2. 빌드 결과물 (dist/) → frontend-build 볼륨에 복사
3. nginx가 /usr/share/nginx/html/ 에서 정적 서빙
```

### 6.2 프론트엔드 Dockerfile.build (Init 컨테이너용)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Minimal image with build output only
FROM alpine:latest
COPY --from=builder /app/dist /app/dist
# docker-compose entrypoint copies /app/dist/* → /output/
```

> frontend-init 컨테이너는 빌드 결과물을 `frontend-build` Named Volume에 복사한 후 종료됩니다. nginx는 `service_completed_successfully` 조건으로 이 컨테이너 완료를 대기합니다.

---

## 7. 운영 명령어 참고

### 7.1 서비스 시작/중지
```bash
# 전체 시작 (프로덕션)
nerdctl compose up -d

# 전체 중지
nerdctl compose down

# 로그 확인
nerdctl compose logs -f backend

# 개발 환경 시작
nerdctl compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### 7.2 데이터베이스 관리
```bash
# DB 백업
nerdctl compose exec postgres pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > backup.sql

# DB 복원
nerdctl compose exec -T postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB} < backup.sql

# DB 접속
nerdctl compose exec postgres psql -U ${POSTGRES_USER} ${POSTGRES_DB}
```

### 7.3 로그 확인
```bash
# 실시간 로그 (nerdctl)
nerdctl compose logs -f backend

# 파일 로그 확인 (볼륨 마운트)
nerdctl compose exec backend cat /app/logs/app.log
nerdctl compose exec backend cat /app/logs/error.log
```

---

## 8. 디렉토리 구조 (인프라 관련 파일)

```
table-order/
  docker-compose.yml
  docker-compose.dev.yml
  .env
  .env.example
  .gitignore
  nginx/
    nginx.conf
    default.conf
  packages/
    backend/
      Dockerfile
      Dockerfile.dev
      src/
        db/
          schema.sql
    frontend/
      Dockerfile
      Dockerfile.build
      Dockerfile.dev
```
