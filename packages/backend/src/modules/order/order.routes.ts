import { Router } from 'express';
import { orderController } from './order.controller';
import { authenticate, requireAdmin, requireTable, requireAny } from '../../middleware/auth.middleware';

const router = Router();

// POST /api/orders — 주문 생성 (고객)
router.post('/', authenticate, requireTable, orderController.createOrder);

// GET /api/orders — 주문 목록 조회 (고객: 세션별, 관리자: 테이블별)
router.get('/', authenticate, requireAny, orderController.getOrders);

// PATCH /api/orders/:orderId/status — 주문 상태 변경 (관리자)
router.patch('/:orderId/status', authenticate, requireAdmin, orderController.updateOrderStatus);

// DELETE /api/orders/:orderId — 주문 삭제 (관리자)
router.delete('/:orderId', authenticate, requireAdmin, orderController.deleteOrder);

export default router;
