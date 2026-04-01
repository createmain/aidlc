import { pool } from '../../config/database';
import { Order, OrderItem } from '../../types';

export const orderRepository = {
  async create(
    tableId: number,
    sessionId: number,
    orderNumber: string,
    totalAmount: number,
    items: { menuItemId: number; menuName: string; quantity: number; unitPrice: number; subtotal: number }[]
  ): Promise<Order> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const orderResult = await client.query(
        `INSERT INTO orders (table_id, session_id, order_number, status, total_amount)
         VALUES ($1, $2, $3, 'pending', $4) RETURNING *`,
        [tableId, sessionId, orderNumber, totalAmount]
      );
      const order = orderResult.rows[0];

      const orderItems: OrderItem[] = [];
      for (const item of items) {
        const itemResult = await client.query(
          `INSERT INTO order_items (order_id, menu_item_id, menu_name, quantity, unit_price, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [order.id, item.menuItemId, item.menuName, item.quantity, item.unitPrice, item.subtotal]
        );
        orderItems.push(itemResult.rows[0]);
      }

      await client.query('COMMIT');
      order.items = orderItems;
      return order;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findBySessionId(sessionId: number): Promise<Order[]> {
    const orders = await pool.query(
      `SELECT * FROM orders
       WHERE session_id = $1 AND is_deleted = FALSE AND is_archived = FALSE
       ORDER BY created_at DESC`,
      [sessionId]
    );
    // 각 주문의 항목 조회
    for (const order of orders.rows) {
      const items = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );
      order.items = items.rows;
    }
    return orders.rows;
  },

  async findByTableId(tableId: number): Promise<Order[]> {
    const orders = await pool.query(
      `SELECT * FROM orders
       WHERE table_id = $1 AND is_deleted = FALSE AND is_archived = FALSE
       ORDER BY created_at DESC`,
      [tableId]
    );
    for (const order of orders.rows) {
      const items = await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [order.id]
      );
      order.items = items.rows;
    }
    return orders.rows;
  },

  async findById(orderId: number): Promise<Order | null> {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (!result.rows[0]) return null;
    const items = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
    result.rows[0].items = items.rows;
    return result.rows[0];
  },

  async updateStatus(orderId: number, status: string): Promise<Order> {
    const result = await pool.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, orderId]
    );
    return result.rows[0];
  },

  async softDelete(orderId: number): Promise<void> {
    await pool.query(
      'UPDATE orders SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1',
      [orderId]
    );
  },

  async sumByTableId(tableId: number): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0)::int AS total
       FROM orders
       WHERE table_id = $1 AND is_deleted = FALSE AND is_archived = FALSE`,
      [tableId]
    );
    return result.rows[0].total;
  },

  async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const result = await pool.query(
      `SELECT COUNT(*)::int + 1 AS seq
       FROM orders
       WHERE created_at::date = CURRENT_DATE`,
    );
    const seq = result.rows[0].seq;
    return `ORD-${dateStr}-${String(seq).padStart(3, '0')}`;
  },
};
