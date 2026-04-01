# Frontend - Infrastructure Design

---

## 1. 인프라 개요

| 항목 | 결정 |
|------|------|
| 빌드 도구 | Vite (React + TypeScript) |
| 서빙 방식 | Nginx 컨테이너 (정적 파일 서빙) |
| API 프록시 | Nginx 리버스 프록시 (/api/* → Backend) |
| Docker 전략 | 호스트 빌드 → Nginx 이미지에 COPY |
| 환경 변수 | .env + Vite VITE_ 접두사 (빌드 시 고정) |
| 포트 | Frontend: 80 (Nginx), Backend: 3000 |

---

## 2. 빌드 도구 — Vite

### 프로젝트 초기화
```
packages/frontend/
├── src/
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── package.json
└── .env
```

### vite.config.ts 핵심 설정
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
})
```

- `server.proxy`: 개발 시 Backend API 프록시 (CORS 우회)
- `build.outDir`: 프로덕션 빌드 결과물 → `dist/`

---

## 3. 환경 변수

### .env 파일
```
VITE_API_BASE_URL=/api
VITE_UPLOADS_BASE_URL=/uploads
```

### 사용 방식
```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL  // '/api'
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_BASE_URL  // '/uploads'
```

- Vite는 `VITE_` 접두사 환경 변수만 클라이언트에 노출
- 빌드 시 고정 (런타임 변경 불가)
- 프로덕션에서는 Nginx 프록시가 `/api`와 `/uploads`를 Backend로 전달하므로 상대 경로 사용

---

## 4. Nginx 설정

### nginx.conf
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # React SPA — 모든 경로를 index.html로 폴백
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 리버스 프록시
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE 리버스 프록시 (Realtime)
    location /api/realtime/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        chunked_transfer_encoding off;
    }

    # 이미지 정적 파일 프록시
    location /uploads/ {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
}
```

핵심 포인트:
- SPA 라우팅: `try_files` → `/customer/*`, `/admin/*` 모두 `index.html`로 폴백
- SSE 프록시: `proxy_buffering off` + `Connection ''` → SSE 스트림 정상 전달
- `/uploads/` 프록시: Backend의 이미지 정적 파일 서빙으로 전달

---

## 5. Docker 설정

### Dockerfile (packages/frontend/Dockerfile)
```dockerfile
FROM nginx:alpine

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물 복사 (호스트에서 빌드 후)
COPY dist/ /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

- 호스트에서 `npm run build` 실행 후 `dist/` 결과물을 이미지에 COPY
- nginx:alpine 기반 (경량 ~40MB)

### 빌드 및 실행 순서
```bash
# 1. 호스트에서 빌드
cd packages/frontend
npm install
npm run build

# 2. Docker 이미지 빌드
docker build -t table-order-frontend .

# 3. 또는 docker-compose로 실행
docker-compose up -d
```

---

## 6. 패키지 의존성

### package.json 핵심 의존성
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "@mui/material": "^5",
    "@mui/icons-material": "^5",
    "@emotion/react": "^11",
    "@emotion/styled": "^11",
    "@dnd-kit/core": "^6",
    "@dnd-kit/sortable": "^7"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@vitejs/plugin-react": "^4",
    "vite": "^5"
  }
}
```

- MUI + Emotion: UI 컴포넌트 + styled-components 대체 (MUI가 Emotion 기반)
- @dnd-kit: 드래그 앤 드롭 (메뉴/카테고리 순서 변경)
- react-router-dom: SPA 라우팅 (`/customer/*`, `/admin/*`)
