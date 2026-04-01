import { Router } from 'express';
import { tableController } from './table.controller';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware';

const router = Router();

// GET /api/tables — 테이블 목록 조회
router.get('/', authenticate, requireAdmin, tableController.getTables);

// POST /api/tables/setup — 테이블 초기 설정
router.post('/setup', authenticate, requireAdmin, tableController.setupTable);

// POST /api/tables/:tableId/complete — 이용 완료
router.post('/:tableId/complete', authenticate, requireAdmin, tableController.completeSession);

// GET /api/tables/:tableId/history — 과거 주문 내역
router.get('/:tableId/history', authenticate, requireAdmin, tableController.getOrderHistory);

// GET /api/tables/:tableId/status — 테이블 상태 조회
router.get('/:tableId/status', authenticate, requireAdmin, tableController.getTableStatus);

export default router;
