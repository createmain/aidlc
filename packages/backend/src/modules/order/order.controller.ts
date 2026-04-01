import { Response, NextFunction } from 'express';
import { orderService } from './order.service';
import { AuthRequest, AppError, TableTokenPayload } from '../../types';
import { toCamelCase, toCamelCaseArray } from '../../utils/case';

function formatOrder(order: Record<string, unknown>): Record<string, unknown> {
  const o = toCamelCase(order);
  if (Array.isArray((order as any).items)) {
    (o as any).items = toCamelCaseArray((order as any).items);
  }
  return o;
}

export const orderController = {
  async createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user as TableTokenPayload;
      const { items } = req.body;
      if (!Array.isArray(items) || items.length === 0) {
        throw new AppError(400, 'VALIDATION_ERROR', '주문 항목이 필요합니다');
      }
      const order = await orderService.createOrder(user.tableId, user.sessionId, items);
      res.status(201).json(formatOrder(order as any));
    } catch (err) { next(err); }
  },

  async getOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      let orders;
      if (user.role === 'table') {
        orders = await orderService.getOrdersBySession((user as TableTokenPayload).sessionId);
      } else {
        const tableId = parseInt(req.query.tableId as string, 10);
        if (!tableId) throw new AppError(400, 'VALIDATION_ERROR', 'tableId가 필요합니다');
        orders = await orderService.getOrdersByTable(tableId);
      }
      res.json({ orders: (orders as any[]).map(formatOrder) });
    } catch (err) { next(err); }
  },

  async updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const orderId = parseInt(req.params.orderId as string, 10);
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
      const orderId = parseInt(req.params.orderId as string, 10);
      const { newTableTotal } = await orderService.deleteOrder(orderId);
      res.json({ message: '주문이 삭제되었습니다', newTableTotal });
    } catch (err) { next(err); }
  },
};
