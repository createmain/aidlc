import { pool } from '../../config/database';

export const systemRepository = {
  async findAdminCount(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM admin_users');
    return result.rows[0].count;
  },

  async createDefaultAdmin(username: string, passwordHash: string): Promise<void> {
    await pool.query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
      [username, passwordHash]
    );
  },

  async findSettingsCount(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*)::int AS count FROM settings');
    return result.rows[0].count;
  },

  async createDefaultSettings(storeName: string, storeIdentifier: string): Promise<void> {
    await pool.query(
      'INSERT INTO settings (store_name, store_identifier) VALUES ($1, $2)',
      [storeName, storeIdentifier]
    );
  },

  async findDefaultCategoryCount(): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*)::int AS count FROM categories WHERE is_default = TRUE'
    );
    return result.rows[0].count;
  },

  async createDefaultCategory(): Promise<void> {
    await pool.query(
      `INSERT INTO categories (name, display_order, is_default) VALUES ('미분류', 0, TRUE)`
    );
  },
};
