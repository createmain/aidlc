import { pool } from '../../config/database';
import { AdminUser, Table, LoginAttempt } from '../../types';

export const authRepository = {
  async findAdminByUsername(username: string): Promise<AdminUser | null> {
    const result = await pool.query(
      'SELECT * FROM admin_users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  },

  async findTableByNumber(tableNumber: number): Promise<Table | null> {
    const result = await pool.query(
      'SELECT * FROM tables WHERE table_number = $1',
      [tableNumber]
    );
    return result.rows[0] || null;
  },

  async findStoreIdentifier(): Promise<string> {
    const result = await pool.query('SELECT store_identifier FROM settings LIMIT 1');
    return result.rows[0]?.store_identifier || '';
  },

  async findLoginAttempt(identifier: string): Promise<LoginAttempt | null> {
    const result = await pool.query(
      'SELECT * FROM login_attempts WHERE identifier = $1',
      [identifier]
    );
    return result.rows[0] || null;
  },

  async incrementLoginAttempts(identifier: string): Promise<void> {
    await pool.query(
      `INSERT INTO login_attempts (identifier, attempt_count, last_attempt_at)
       VALUES ($1, 1, NOW())
       ON CONFLICT (identifier)
       DO UPDATE SET
         attempt_count = login_attempts.attempt_count + 1,
         last_attempt_at = NOW(),
         locked_until = CASE
           WHEN login_attempts.attempt_count + 1 >= 5
           THEN NOW() + INTERVAL '15 minutes'
           ELSE login_attempts.locked_until
         END`,
      [identifier]
    );
  },

  async resetLoginAttempts(identifier: string): Promise<void> {
    await pool.query(
      `UPDATE login_attempts SET attempt_count = 0, locked_until = NULL WHERE identifier = $1`,
      [identifier]
    );
  },
};
