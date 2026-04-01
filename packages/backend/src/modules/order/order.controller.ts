import { Response, NextFunction } from 'express';
import { orderService } from './order.service';
import { AuthRequest, AppError, TableTokenPayload } from '../../types';

export const orderController = {
  async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as TableTokenPayload;
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError(400, 'VALIDATION_ERROR', '주문 항목이 필요합니다');
      }

      const order = await orderService.createOrder(user.tableId, user.sessionId, items);
      res.status(201).json(order);
    } catch (err) { next(err); }
  },

  async getOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      let orders;

      if (user.role === 'table') {
        // 고객: 현재 세션 주문
        orders = await orderService.getOrdersBySession((user as TableTokenPayload).sessionId);
      } else {
        // 관리자: 테이블별 조회
        const tableId = parseInt(req.query.tableId as string, 10);
        if (!tableId) throw new AppError(400, 'VALIDATION_ERROR', 'tableId가 필요합니다');
        orders = await orderService.getOrdersByTable(tableId);
      }

      res.json({ orders });
    } catch (err) { next(err); }
  },

  async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      const { status } = req.body;
      if (!status || !['pending', 'preparing', 'completed'].includes(status)) {
        throw new AppError(400, 'VALIDATION_ERROR', '유효한 상태값이 필요합니다 (pending, preparing, completed)');
      }

      const order = await orderService.updateStatus(orderId, status);
      res.json({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        updatedAt: order.updated_at,
      });
    } catch (err) { next(err); }
  },

  async deleteOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId, 10);
      const { newTableTotal } = await orderService.deleteOrder(orderId);
      res.json({ message: '주문이 삭제되었습니다', newTableTotal });
    } catch (err) { next(err); }
  },
};
