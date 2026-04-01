import { pool } from '../../config/database';
import { Table, TableSession, OrderHistory } from '../../types';

export const tableRepository = {
  async findAll(): Promise<Table[]> {
    const result = await pool.query('SELECT * FROM tables ORDER BY table_number ASC');
    return result.rows;
  },

  async findByNumber(tableNumber: number): Promise<Table | null> {
    const result = await pool.query('SELECT * FROM tables WHERE table_number = $1', [tableNumber]);
    return result.rows[0] || null;
  },

  async findById(tableId: number): Promise<Table | null> {
    const result = await pool.query('SELECT * FROM tables WHERE id = $1', [tableId]);
    return result.rows[0] || null;
  },

  async create(tableNumber: number, passwordHash: string): Promise<Table> {
    const result = await pool.query(
      'INSERT INTO tables (table_number, password_hash) VALUES ($1, $2) RETURNING *',
      [tableNumber, passwordHash]
    );
    return result.rows[0];
  },

  async updatePassword(tableId: number, passwordHash: string): Promise<void> {
    await pool.query('UPDATE tables SET password_hash = $1 WHERE id = $2', [passwordHash, tableId]);
  },

  async findActiveSession(tableId: number): Promise<TableSession | null> {
    const result = await pool.query(
      `SELECT * FROM table_sessions
       WHERE table_id = $1 AND status = 'active' AND expires_at > NOW()
       ORDER BY started_at DESC LIMIT 1`,
      [tableId]
    );
    return result.rows[0] || null;
  },

  async findLatestSession(tableId: number): Promise<TableSession | null> {
    const result = await pool.query(
      'SELECT * FROM table_sessions WHERE table_id = $1 ORDER BY started_at DESC LIMIT 1',
      [tableId]
    );
    return result.rows[0] || null;
  },

  async createSession(tableId: number): Promise<TableSession> {
    const result = await pool.query(
      `INSERT INTO table_sessions (table_id, status, expires_at)
       VALUES ($1, 'active', NOW() + INTERVAL '16 hours')
       RETURNING *`,
      [tableId]
    );
    return result.rows[0];
  },

  async completeSession(sessionId: number): Promise<void> {
    await pool.query(
      `UPDATE table_sessions SET status = 'completed', completed_at = NOW() WHERE id = $1`,
      [sessionId]
    );
  },

  async completeActiveSessionsForTable(tableId: number): Promise<void> {
    await pool.query(
      `UPDATE table_sessions SET status = 'completed', completed_at = NOW()
       WHERE table_id = $1 AND status = 'active'`,
      [tableId]
    );
  },

  async moveOrdersToHistory(sessionId: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 활성 주문 조회 (삭제되지 않고 아카이브되지 않은 주문)
      const orders = await client.query(
        `SELECT o.*, json_agg(
           json_build_object(
             'menu_name', oi.menu_name,
             'quantity', oi.quantity,
             'unit_price', oi.unit_price,
             'subtotal', oi.subtotal
           )
         ) AS items_json
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.session_id = $1 AND o.is_deleted = FALSE AND o.is_archived = FALSE
         GROUP BY o.id`,
        [sessionId]
      );

      // 각 주문을 이력으로 복사
      for (const order of orders.rows) {
        const snapshot = {
          order_id: order.id,
          order_number: order.order_number,
          status: order.status,
          items: order.items_json,
          total_amount: order.total_amount,
          created_at: order.created_at,
        };

        await client.query(
          `INSERT INTO order_history (table_id, session_id, order_snapshot, total_amount, ordered_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.table_id, sessionId, JSON.stringify(snapshot), order.total_amount, order.created_at]
        );
      }

      // 원본 주문 아카이브 처리
      await client.query(
        `UPDATE orders SET is_archived = TRUE, updated_at = NOW()
         WHERE session_id = $1 AND is_deleted = FALSE AND is_archived = FALSE`,
        [sessionId]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async findOrderHistory(
    tableId: number,
    dateFilter?: { from?: string; to?: string }
  ): Promise<OrderHistory[]> {
    let query = 'SELECT * FROM order_history WHERE table_id = $1';
    const params: unknown[] = [tableId];
    let idx = 2;

    if (dateFilter?.from) {
      query += ` AND completed_at >= $${idx}`;
      params.push(dateFilter.from);
      idx++;
    }
    if (dateFilter?.to) {
      query += ` AND completed_at <= $${idx}`;
      params.push(dateFilter.to);
      idx++;
    }

    query += ' ORDER BY completed_at DESC';
    const result = await pool.query(query, params);
    return result.rows;
  },
};
