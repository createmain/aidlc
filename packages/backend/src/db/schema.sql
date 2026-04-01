-- 테이블오더 서비스 DB 스키마
-- PostgreSQL 16

-- 1. settings (매장 설정 — 단일 매장, 항상 1행)
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  store_name VARCHAR(100) NOT NULL,
  store_identifier VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. admin_users (관리자 — 1개 고정)
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. tables (테이블)
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  table_number INTEGER UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. table_sessions (테이블 세션)
CREATE TABLE IF NOT EXISTS table_sessions (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES tables(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP
);

-- 5. categories (카테고리)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 6. menu_items (메뉴)
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  name VARCHAR(100) NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  description TEXT,
  image_path VARCHAR(255),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 7. orders (주문)
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES tables(id),
  session_id INTEGER NOT NULL REFERENCES table_sessions(id),
  order_number VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  total_amount INTEGER NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 8. order_items (주문 항목)
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
  menu_name VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL,
  subtotal INTEGER NOT NULL
);

-- 9. order_history (주문 이력)
CREATE TABLE IF NOT EXISTS order_history (
  id SERIAL PRIMARY KEY,
  table_id INTEGER NOT NULL REFERENCES tables(id),
  session_id INTEGER NOT NULL,
  order_snapshot JSONB NOT NULL,
  total_amount INTEGER NOT NULL,
  ordered_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 10. login_attempts (로그인 시도)
CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  identifier VARCHAR(100) UNIQUE NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP,
  locked_until TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_table_sessions_table_status ON table_sessions(table_id, status);
CREATE INDEX IF NOT EXISTS idx_table_sessions_expires ON table_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_categories_display_order ON categories(display_order);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_order ON menu_items(category_id, display_order);
CREATE INDEX IF NOT EXISTS idx_orders_session_deleted ON orders(session_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_orders_table_deleted ON orders(table_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_created ON orders(is_deleted, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_table_completed ON order_history(table_id, completed_at);
CREATE INDEX IF NOT EXISTS idx_order_history_completed ON order_history(completed_at);
