import express from 'express';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import menuRoutes from './modules/menu/menu.routes';
import orderRoutes from './modules/order/order.routes';
import tableRoutes from './modules/table/table.routes';
import realtimeRoutes from './modules/realtime/realtime.routes';

const app = express();

// 기본 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (메뉴 이미지)
app.use('/uploads', express.static(path.join(env.uploadDir)));

// 헬스체크
app.get('/api/health', async (_req, res) => {
  try {
    const { pool } = await import('./config/database');
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/realtime', realtimeRoutes);

// 글로벌 에러 핸들러
app.use(errorHandler);

export default app;
