# Frontend - Deployment Architecture

---

## 1. 컨테이너 구성

```
+--------------------------------------------------+
|  docker-compose                                  |
|                                                  |
|  +--------------------+  +--------------------+  |
|  |  frontend (Nginx)  |  |  backend (Node.js) |  |
|  |  Port: 80          |  |  Port: 3000        |  |
|  |                    |  |                    |  |
|  |  /api/* ---------> |->|  Express/Fastify   |  |
|  |  /uploads/* -----> |->|  Static files      |  |
|  |  /* -> index.html  |  |                    |  |
|  +--------------------+  +--------------------+  |
|                              |                    |
|                          +---v----------------+   |
|                          |  postgres (DB)     |   |
|                          |  Port: 5432        |   |
|                          +--------------------+   |
+--------------------------------------------------+
```

- Frontend(Nginx): 사용자 진입점, 정적 파일 서빙 + API/SSE/이미지 프록시
- Backend(Node.js): API 서버, SSE, 이미지 업로드/서빙
- PostgreSQL: 데이터 영속화 (Backend 전용)

---

## 2. docker-compose.yml (Frontend 관련 부분)

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./packages/frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

  backend:
    build:
      context: ./packages/backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@postgres:5432/tableorder
      - JWT_SECRET=your-jwt-secret
      - NODE_ENV=production
    depends_on:
      - postgres
    volumes:
      - uploads:/app/uploads
    networks:
      - app-network

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=tableorder
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  pgdata:
  uploads:
```

핵심 포인트:
- `frontend` → `backend` 의존 (depends_on)
- `app-network` 브리지 네트워크로 컨테이너 간 통신 (Nginx에서 `backend:3000`으로 프록시)
- `uploads` 볼륨: Backend 이미지 업로드 영속화

---

## 3. 네트워크 흐름

### 사용자 요청 흐름

```
사용자 브라우저
    |
    v
[Frontend Nginx :80]
    |
    +-- /* (정적 파일) --> dist/index.html, JS, CSS
    |
    +-- /api/* --> [Backend :3000] --> API 처리
    |
    +-- /api/realtime/* --> [Backend :3000] --> SSE 스트림
    |
    +-- /uploads/* --> [Backend :3000] --> 이미지 파일
```

### 개발 환경 흐름

```
개발자 브라우저
    |
    v
[Vite Dev Server :5173]
    |
    +-- /* (HMR) --> React 컴포넌트
    |
    +-- /api/* --> proxy --> [Backend :3000]
    |
    +-- /uploads/* --> proxy --> [Backend :3000]
```

---

## 4. 개발 환경 vs 프로덕션 환경

| 항목 | 개발 | 프로덕션 |
|------|------|----------|
| Frontend 서버 | Vite dev server (:5173) | Nginx (:80) |
| API 프록시 | Vite proxy 설정 | Nginx reverse proxy |
| HMR | 활성 | 없음 (정적 빌드) |
| 소스맵 | 활성 | 비활성 |
| 빌드 | 불필요 (즉시 반영) | `npm run build` → dist/ |
| Docker | 선택 (로컬 개발 가능) | 필수 |

### 개발 환경 실행
```bash
# Backend (별도 터미널 또는 docker-compose)
cd packages/backend
npm run dev  # :3000

# Frontend
cd packages/frontend
npm run dev  # :5173 (Vite proxy → :3000)
```

### 프로덕션 빌드 및 배포
```bash
# 1. Frontend 빌드
cd packages/frontend
npm run build

# 2. 전체 서비스 실행
docker-compose up -d --build
```

---

## 5. 디렉토리 구조 (최종)

```
table-order/
  packages/
    frontend/
      src/                    # React 소스 코드
      public/                 # 정적 에셋
      dist/                   # 빌드 결과물 (gitignore)
      index.html              # Vite 진입점
      vite.config.ts          # Vite 설정
      tsconfig.json           # TypeScript 설정
      package.json            # 의존성
      .env                    # 환경 변수
      Dockerfile              # Nginx 기반 Docker 이미지
      nginx.conf              # Nginx 설정
    backend/
      ...                     # (별도 담당자)
  docker-compose.yml          # 전체 서비스 오케스트레이션
  package.json                # 모노레포 루트
```
