import { pool } from '../../config/database';
import { MenuItem, Category } from '../../types';

export const menuRepository = {
  async findAll(categoryId?: number): Promise<MenuItem[]> {
    let query = `
      SELECT mi.*, c.name AS category_name
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
    `;
    const params: unknown[] = [];
    if (categoryId) {
      query += ' WHERE mi.category_id = $1';
      params.push(categoryId);
    }
    query += ' ORDER BY mi.display_order ASC';
    const result = await pool.query(query, params);
    return result.rows;
  },

  async findById(menuId: number): Promise<MenuItem | null> {
    const result = await pool.query(
      `SELECT mi.*, c.name AS category_name
       FROM menu_items mi
       JOIN categories c ON mi.category_id = c.id
       WHERE mi.id = $1`,
      [menuId]
    );
    return result.rows[0] || null;
  },

  async create(data: {
    category_id: number;
    name: string;
    price: number;
    description?: string;
    image_path?: string;
    display_order: number;
  }): Promise<MenuItem> {
    const result = await pool.query(
      `INSERT INTO menu_items (category_id, name, price, description, image_path, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.category_id, data.name, data.price, data.description || null, data.image_path || null, data.display_order]
    );
    return result.rows[0];
  },

  async update(menuId: number, data: Partial<{
    category_id: number;
    name: string;
    price: number;
    description: string;
    image_path: string | null;
  }>): Promise<MenuItem> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }
    fields.push(`updated_at = NOW()`);
    values.push(menuId);

    const result = await pool.query(
      `UPDATE menu_items SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0];
  },

  async delete(menuId: number): Promise<void> {
    await pool.query('DELETE FROM menu_items WHERE id = $1', [menuId]);
  },

  async getMaxDisplayOrder(categoryId: number): Promise<number> {
    const result = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) AS max_order FROM menu_items WHERE category_id = $1',
      [categoryId]
    );
    return result.rows[0].max_order;
  },

  async updateOrder(menuOrders: { id: number; displayOrder: number }[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of menuOrders) {
        await client.query(
          'UPDATE menu_items SET display_order = $1, updated_at = NOW() WHERE id = $2',
          [item.displayOrder, item.id]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Category methods
  async findAllCategories(): Promise<Category[]> {
    const result = await pool.query('SELECT * FROM categories ORDER BY display_order ASC');
    return result.rows;
  },

  async findCategoryById(categoryId: number): Promise<Category | null> {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [categoryId]);
    return result.rows[0] || null;
  },

  async createCategory(data: { name: string; display_order: number }): Promise<Category> {
    const result = await pool.query(
      'INSERT INTO categories (name, display_order) VALUES ($1, $2) RETURNING *',
      [data.name, data.display_order]
    );
    return result.rows[0];
  },

  async updateCategory(categoryId: number, data: { name: string }): Promise<Category> {
    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [data.name, categoryId]
    );
    return result.rows[0];
  },

  async deleteCategory(categoryId: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // 미분류 카테고리 ID 조회
      const defaultCat = await client.query(
        'SELECT id FROM categories WHERE is_default = TRUE LIMIT 1'
      );
      const defaultCatId = defaultCat.rows[0]?.id;
      // 소속 메뉴를 미분류로 이동
      await client.query(
        'UPDATE menu_items SET category_id = $1, updated_at = NOW() WHERE category_id = $2',
        [defaultCatId, categoryId]
      );
      await client.query('DELETE FROM categories WHERE id = $1', [categoryId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async countMenusByCategory(categoryId: number): Promise<number> {
    const result = await pool.query(
      'SELECT COUNT(*)::int AS count FROM menu_items WHERE category_id = $1',
      [categoryId]
    );
    return result.rows[0].count;
  },

  async getMaxCategoryDisplayOrder(): Promise<number> {
    const result = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) AS max_order FROM categories'
    );
    return result.rows[0].max_order;
  },

  async updateCategoryOrder(categoryOrders: { id: number; displayOrder: number }[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const item of categoryOrders) {
        await client.query(
          'UPDATE categories SET display_order = $1 WHERE id = $2',
          [item.displayOrder, item.id]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
