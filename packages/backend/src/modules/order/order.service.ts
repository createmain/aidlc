import { orderRepository } from './order.repository';
import { realtimeService } from '../realtime/realtime.service';
import { AppError, Order } from '../../types';
import { pool } from '../../config/database';

// 허용 상태 전이 맵
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ['preparing'],
  preparing: ['completed', 'pending'],
  completed: [], // 종착 상태
};

export const orderService = {
  async createOrder(
    tableId: number,
    sessionId: number,
    items: { menuItemId: number; quantity: number }[]
  ): Promise<Order> {
    // 1. 활성 세션 확인
    const sessionResult = await pool.query(
      `SELECT * FROM table_sessions
       WHERE id = $1 AND table_id = $2 AND status = 'active' AND expires_at > NOW()`,
      [sessionId, tableId]
    );
    if (!sessionResult.rows[0]) {
      throw new AppError(409, 'STATE_ERROR', '유효한 세션이 없습니다');
    }

    // 2. 메뉴 항목 검증 및 가격 조회
    const orderItems: { menuItemId: number; menuName: string; quantity: number; unitPrice: number; subtotal: number }[] = [];
    let totalAmount = 0;

    for (const item of items) {
      if (item.quantity <= 0) {
        throw new AppError(400, 'VALIDATION_ERROR', '수량은 0보다 커야 합니다');
      }
      const menuResult = await pool.query('SELECT * FROM menu_items WHERE id = $1', [item.menuItemId]);
      if (!menuResult.rows[0]) {
        throw new AppError(404, 'NOT_FOUND', `메뉴 ID ${item.menuItemId}를 찾을 수 없습니다`);
      }
      const menu = menuResult.rows[0];
      const subtotal = menu.price * item.quantity;
      orderItems.push({
        menuItemId: item.menuItemId,
        menuName: menu.name,
        quantity: item.quantity,
        unitPrice: menu.price,
        subtotal,
      });
      totalAmount += subtotal;
    }

    // 3. 주문 번호 생성
    const orderNumber = await orderRepository.generateOrderNumber();

    // 4. 주문 저장
    const order = await orderRepository.create(tableId, sessionId, orderNumber, totalAmount, orderItems);

    // 5. Realtime 이벤트 발행
    const tableResult = await pool.query('SELECT table_number FROM tables WHERE id = $1', [tableId]);
    realtimeService.broadcast('new-order', {
      orderId: order.id,
      tableId,
      tableNumber: tableResult.rows[0]?.table_number,
      orderNumber: order.order_number,
      items: order.items,
      totalAmount: order.total_amount,
    });

    return order;
  },

  async getOrdersBySession(sessionId: number): Promise<Order[]> {
    return orderRepository.findBySessionId(sessionId);
  },

  async getOrdersByTable(tableId: number): Promise<Order[]> {
    return orderRepository.findByTableId(tableId);
  },

  async updateStatus(orderId: number, newStatus: string): Promise<Order> {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new AppError(404, 'NOT_FOUND', '주문을 찾을 수 없습니다');
    if (order.is_deleted) throw new AppError(409, 'STATE_ERROR', '삭제된 주문입니다');
    if (order.status === 'completed') {
      throw new AppError(409, 'STATE_ERROR', '완료된 주문은 상태를 변경할 수 없습니다');
    }

    const allowed = ALLOWED_TRANSITIONS[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(409, 'STATE_ERROR', `${order.status}에서 ${newStatus}로 변경할 수 없습니다`);
    }

    const updated = await orderRepository.updateStatus(orderId, newStatus);

    // Realtime 이벤트
    realtimeService.broadcast('order-status-changed', {
      orderId: updated.id,
      tableId: updated.table_id,
      previousStatus: order.status,
      newStatus: updated.status,
    });

    return updated;
  },

  async deleteOrder(orderId: number): Promise<{ newTableTotal: number }> {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new AppError(404, 'NOT_FOUND', '주문을 찾을 수 없습니다');
    if (order.is_deleted) throw new AppError(409, 'STATE_ERROR', '이미 삭제된 주문입니다');

    await orderRepository.softDelete(orderId);
    const newTableTotal = await orderRepository.sumByTableId(order.table_id);

    // Realtime 이벤트
    realtimeService.broadcast('order-deleted', {
      orderId,
      tableId: order.table_id,
      newTableTotal,
    });

    return { newTableTotal };
  },

  async recalculateTableTotal(tableId: number): Promise<number> {
    return orderRepository.sumByTableId(tableId);
  },
};
