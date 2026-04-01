import bcrypt from 'bcryptjs';
import { tableRepository } from './table.repository';
import { realtimeService } from '../realtime/realtime.service';
import { AppError, TableStatus } from '../../types';
import { pool } from '../../config/database';
import { logger } from '../../config/logger';

export const tableService = {
  async getTables(): Promise<TableStatus[]> {
    const tables = await tableRepository.findAll();
    const result: TableStatus[] = [];

    for (const table of tables) {
      const session = await tableRepository.findLatestSession(table.id);
      let sessionStatus: 'active' | 'completed' | 'expired' | null = null;

      if (session) {
        if (session.status === 'completed') {
          sessionStatus = 'completed';
        } else if (session.status === 'active' && new Date(session.expires_at) > new Date()) {
          sessionStatus = 'active';
        } else {
          sessionStatus = 'expired';
        }
      }

      // 활성 주문 수 및 총액
      const orderResult = await pool.query(
        `SELECT COUNT(*)::int AS count, COALESCE(SUM(total_amount), 0)::int AS total
         FROM orders
         WHERE table_id = $1 AND is_deleted = FALSE AND is_archived = FALSE`,
        [table.id]
      );

      result.push({
        id: table.id,
        tableId: table.id,
        tableNumber: table.table_number,
        sessionStatus,
        orderCount: orderResult.rows[0].count,
        totalAmount: orderResult.rows[0].total,
      });
    }

    return result;
  },

  async setupTable(
    tableNumber: number,
    password: string
  ): Promise<{ tableId: number; tableNumber: number; sessionId: number; sessionExpiresAt: Date }> {
    const passwordHash = await bcrypt.hash(password, 10);
    let table = await tableRepository.findByNumber(tableNumber);

    if (table) {
      // 기존 테이블: 비밀번호 업데이트 + 기존 활성 세션 완료 처리
      await tableRepository.updatePassword(table.id, passwordHash);
      await tableRepository.completeActiveSessionsForTable(table.id);
    } else {
      // 새 테이블 생성
      table = await tableRepository.create(tableNumber, passwordHash);
    }

    // 새 세션 생성
    const session = await tableRepository.createSession(table.id);

    // 미분류 카테고리 존재 확인
    const defaultCat = await pool.query(
      'SELECT COUNT(*)::int AS count FROM categories WHERE is_default = TRUE'
    );
    if (defaultCat.rows[0].count === 0) {
      logger.warn('미분류 카테고리가 없습니다. System 모듈 초기화를 확인하세요.');
    }

    return {
      tableId: table.id,
      tableNumber: table.table_number,
      sessionId: session.id,
      sessionExpiresAt: session.expires_at,
    };
  },

  async completeSession(tableId: number): Promise<{ completedAt: Date }> {
    const session = await tableRepository.findActiveSession(tableId);
    if (!session) {
      throw new AppError(409, 'STATE_ERROR', '활성 세션이 없습니다');
    }

    // 주문 이력 이동
    await tableRepository.moveOrdersToHistory(session.id);

    // 세션 완료 처리
    await tableRepository.completeSession(session.id);

    const completedAt = new Date();

    // Realtime 이벤트
    realtimeService.broadcast('session-completed', {
      tableId,
      completedAt: completedAt.toISOString(),
    });

    return { completedAt };
  },

  async getOrderHistory(
    tableId: number,
    dateFilter?: { from?: string; to?: string }
  ) {
    return tableRepository.findOrderHistory(tableId, dateFilter);
  },

  async getTableStatus(tableId: number): Promise<TableStatus> {
    const table = await tableRepository.findById(tableId);
    if (!table) throw new AppError(404, 'NOT_FOUND', '테이블을 찾을 수 없습니다');

    const session = await tableRepository.findLatestSession(tableId);
    let sessionStatus: 'active' | 'completed' | 'expired' | null = null;

    if (session) {
      if (session.status === 'completed') sessionStatus = 'completed';
      else if (session.status === 'active' && new Date(session.expires_at) > new Date()) sessionStatus = 'active';
      else sessionStatus = 'expired';
    }

    const orderResult = await pool.query(
      `SELECT COUNT(*)::int AS count, COALESCE(SUM(total_amount), 0)::int AS total
       FROM orders
       WHERE table_id = $1 AND is_deleted = FALSE AND is_archived = FALSE`,
      [tableId]
    );

    return {
      id: table.id,
      tableId: table.id,
      tableNumber: table.table_number,
      sessionStatus,
      orderCount: orderResult.rows[0].count,
      totalAmount: orderResult.rows[0].total,
    };
  },
};
