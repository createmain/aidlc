import { Router } from 'express';
import { realtimeController } from './realtime.controller';
import { authenticate, requireAdmin, requireTable } from '../../middleware/auth.middleware';

const router = Router();

// GET /api/realtime/subscribe — 관리자 SSE 구독
router.get('/subscribe', authenticate, requireAdmin, realtimeController.subscribe);

// GET /api/realtime/subscribe/customer — 고객 SSE 구독 (선택사항)
router.get('/subscribe/customer', authenticate, requireTable, realtimeController.subscribeCustomer);

export default router;
