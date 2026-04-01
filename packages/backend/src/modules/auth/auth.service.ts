import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { authRepository } from './auth.repository';
import { AppError, AdminTokenPayload, TableTokenPayload } from '../../types';
import { pool } from '../../config/database';

export const authService = {
  async authenticateAdmin(
    storeIdentifier: string,
    username: string,
    password: string
  ): Promise<{ token: string; expiresIn: string }> {
    // 1. 매장 식별자 확인
    const storedIdentifier = await authRepository.findStoreIdentifier();
    if (storedIdentifier !== storeIdentifier) {
      throw new AppError(401, 'AUTH_ERROR', '인증 실패');
    }

    // 2. 로그인 시도 제한 확인
    const identifier = username;
    await this.checkLoginAttempts(identifier);

    // 3. 관리자 조회
    const admin = await authRepository.findAdminByUsername(username);
    if (!admin) {
      await authRepository.incrementLoginAttempts(identifier);
      throw new AppError(401, 'AUTH_ERROR', '인증 실패');
    }

    // 4. 비밀번호 검증
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      await authRepository.incrementLoginAttempts(identifier);
      // 잠금 여부 재확인
      const attempt = await authRepository.findLoginAttempt(identifier);
      if (attempt && attempt.locked_until && new Date(attempt.locked_until) > new Date()) {
        const minutesLeft = Math.ceil(
          (new Date(attempt.locked_until).getTime() - Date.now()) / 60000
        );
        throw new AppError(423, 'ACCOUNT_LOCKED', `계정이 잠금되었습니다. ${minutesLeft}분 후 다시 시도하세요`, [{ retryAfter: minutesLeft }]);
      }
      throw new AppError(401, 'AUTH_ERROR', '인증 실패');
    }

    // 5. 성공 → 리셋
    await authRepository.resetLoginAttempts(identifier);

    // 6. JWT 발급
    const payload: AdminTokenPayload = { adminId: admin.id, role: 'admin' };
    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);

    return { token, expiresIn: env.jwtExpiresIn };
  },

  async authenticateTable(
    storeIdentifier: string,
    tableNumber: number,
    password: string
  ): Promise<{ token: string; expiresIn: number; tableId: number; sessionId: number }> {
    // 1. 매장 식별자 확인
    const storedIdentifier = await authRepository.findStoreIdentifier();
    if (storedIdentifier !== storeIdentifier) {
      throw new AppError(401, 'AUTH_ERROR', '매장 정보 없음');
    }

    // 2. 테이블 조회
    const table = await authRepository.findTableByNumber(tableNumber);
    if (!table) {
      throw new AppError(404, 'NOT_FOUND', '테이블 정보 없음');
    }

    // 3. 비밀번호 검증
    const isValid = await bcrypt.compare(password, table.password_hash);
    if (!isValid) {
      throw new AppError(401, 'AUTH_ERROR', '인증 실패');
    }

    // 4. 활성 세션 확인
    const sessionResult = await pool.query(
      `SELECT * FROM table_sessions
       WHERE table_id = $1 AND status = 'active' AND expires_at > NOW()
       ORDER BY started_at DESC LIMIT 1`,
      [table.id]
    );
    const session = sessionResult.rows[0];

    if (!session) {
      // 세션 없음/만료/완료 구분
      const anySession = await pool.query(
        `SELECT * FROM table_sessions WHERE table_id = $1 ORDER BY started_at DESC LIMIT 1`,
        [table.id]
      );
      if (!anySession.rows[0]) {
        throw new AppError(409, 'STATE_ERROR', '활성 세션 없음 — 세션 미생성 (관리자 초기 설정 필요)');
      }
      if (anySession.rows[0].status === 'completed') {
        throw new AppError(409, 'STATE_ERROR', '세션 완료 — 이용 완료 처리됨 (관리자 재설정 필요)');
      }
      throw new AppError(409, 'STATE_ERROR', '세션 만료 — expires_at 초과 (관리자 재설정 필요)');
    }

    // 5. 토큰 발급
    const expiresInSec = Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 1000);
    const payload: TableTokenPayload = {
      tableId: table.id,
      sessionId: session.id,
      role: 'table',
    };
    const token = jwt.sign(payload, env.jwtSecret, { expiresIn: expiresInSec });

    return { token, expiresIn: expiresInSec, tableId: table.id, sessionId: session.id };
  },

  async checkLoginAttempts(identifier: string): Promise<void> {
    const attempt = await authRepository.findLoginAttempt(identifier);
    if (!attempt) return;

    if (attempt.locked_until && new Date(attempt.locked_until) > new Date()) {
      const minutesLeft = Math.ceil(
        (new Date(attempt.locked_until).getTime() - Date.now()) / 60000
      );
      throw new AppError(423, 'ACCOUNT_LOCKED', `계정이 잠금되었습니다. ${minutesLeft}분 후 다시 시도하세요`, [{ retryAfter: minutesLeft }]);
    }

    // 잠금 시간 경과 후 → 리셋
    if (attempt.locked_until && new Date(attempt.locked_until) <= new Date()) {
      await authRepository.resetLoginAttempts(identifier);
    }
  },
};
