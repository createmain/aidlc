# Backend - 도메인 엔티티 설계

---

## 1. 엔티티 목록 및 관계 요약

> **단일 매장 전용**: store_id FK 없이 단일 매장 구조. 매장 정보는 settings 테이블로 관리.

```
settings (단독 — 매장 설정 1행)
admin_users (단독 — 1개 고정)
tables (1) ──── (N) table_sessions
tables (1) ──── (N) orders
table_sessions (1) ──── (N) orders
orders (1) ──── (N) order_items
menu_items (1) ──── (N) order_items
categories (1) ──── (N) menu_items
tables (1) ──── (N) order_history
login_attempts (독립)
```

---

## 2. 엔티티 상세 정의

### 2.1 settings (매장 설정)

> 단일 매장 전용. 항상 1행만 존재.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | SERIAL | PK | 설정 고유 ID (항상 1) |
| store_name | VARCHAR(100) | NOT NULL | 매장명 |
| store_identifier | VARCHAR(50) | UNIQUE, NOT NULL | 매장 식별자 (로그인용) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 생성 시각 |

### 2.2 admin_users (관리자)

> 단일 매장이므로 1개 고정.

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | SERIAL | PK | 관리자 고유 ID |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 사용자명 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 해싱된 비밀번호 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 생성 시각 |

### 2.3 tables (테이블)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | SERIAL | PK | 테이블 고유 ID |
| table_number | INTEGER | UNIQUE, NOT NULL | 테이블 번호 |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt 해싱된 비밀번호 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 생성 시각 |

### 2.4 table_sessions (테이블 세션)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | SERIAL | PK | 세션 고유 ID |
| table_id | INTEGER | FK → tables.id, NOT NULL | 소속 테이블 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'active' | 상태: active, completed, expired |
| started_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 세션 시작 시각 |
| expires_at | TIMESTAMP | NOT NULL | 만료 시각 (started_at + 16h) |
| completed_at | TIMESTAMP | NULL | 이용 완료 시각 |

- status 값:
  - `active`: 활성 — 주문 가능
  - `completed`: 이용 완료 — 관리자가 이용 완료 처리, 주문 불가
  - `expired`: 만료 — expires_at < NOW(), 주문 불가
- 만료 판정: `expires_at < NOW()` 이면 만료 상태로 표시
- 이용 완료: status='completed', completed_at 설정 → 세션 종료, 새 주문 불가

### 2.5 categories (카테고리)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | SERIAL | PK | 카테고리 고유 ID |
| name | VARCHAR(50) | UNIQUE, NOT NULL | 카테고리명 |
| display_order | INTEGER | NOT NULL, DEFAULT 0 | 노출 순서 (100 단위 간격) |
| is_default | BOOLEAN | NOT NULL, DEFAULT FALSE | 미분류 카테고리 여부 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 생성 시각 |

- 매장 내 is_default=TRUE인 카테고리 1개 (시스템 자동 생성, 삭제 불가)

### 2.6 menu_items (메뉴)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | SERIAL | PK | 메뉴 고유 ID |
| category_id | INTEGER | FK → categories.id, NOT NULL | 소속 카테고리 |
| name | VARCHAR(100) | NOT NULL | 메뉴명 |
| price | INTEGER | NOT NULL, CHECK(price >= 0) | 가격 (원 단위) |
| description | TEXT | NULL | 메뉴 설명 |
| image_path | VARCHAR(255) | NULL | 이미지 파일 경로 |
| display_order | INTEGER | NOT NULL, DEFAULT 0 | 노출 순서 (100 단위 간격) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 수정 시각 |

### 2.7 orders (주문)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | SERIAL | PK | 주문 고유 ID |
| table_id | INTEGER | FK → tables.id, NOT NULL | 주문 테이블 |
| session_id | INTEGER | FK → table_sessions.id, NOT NULL | 주문 세션 |
| order_number | VARCHAR(20) | NOT NULL | 주문 번호 (표시용) |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | 상태 |
| total_amount | INTEGER | NOT NULL | 주문 총액 (원) |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT FALSE | 논리 삭제 플래그 |
| is_archived | BOOLEAN | NOT NULL, DEFAULT FALSE | 이력 복사 완료 플래그 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 주문 시각 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 수정 시각 |

- status 값: `pending` (대기중), `preparing` (준비중), `completed` (완료)
- 허용 전이: pending ↔ preparing → completed (completed는 종착 상태, 변경 불가)
- is_deleted=TRUE인 주문은 조회 시 제외
- is_archived=TRUE인 주문은 이용 완료 시 이력으로 복사 완료된 주문

### 2.8 order_items (주문 항목)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | SERIAL | PK | 항목 고유 ID |
| order_id | INTEGER | FK → orders.id, NOT NULL | 소속 주문 |
| menu_item_id | INTEGER | FK → menu_items.id, NOT NULL | 메뉴 참조 |
| menu_name | VARCHAR(100) | NOT NULL | 주문 시점 메뉴명 (스냅샷) |
| quantity | INTEGER | NOT NULL, CHECK(quantity > 0) | 수량 |
| unit_price | INTEGER | NOT NULL | 주문 시점 단가 (스냅샷) |
| subtotal | INTEGER | NOT NULL | 소계 (quantity × unit_price) |

### 2.9 order_history (주문 이력)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | SERIAL | PK | 이력 고유 ID |
| table_id | INTEGER | FK → tables.id, NOT NULL | 테이블 |
| session_id | INTEGER | NOT NULL | 세션 ID (참조용) |
| order_snapshot | JSONB | NOT NULL | 주문 전체 JSON 스냅샷 |
| total_amount | INTEGER | NOT NULL | 주문 총액 |
| ordered_at | TIMESTAMP | NOT NULL | 원본 주문 시각 |
| completed_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 이용 완료 처리 시각 |

- order_snapshot 구조:
```json
{
  "order_id": 1,
  "order_number": "ORD-001",
  "status": "completed",
  "items": [
    { "menu_name": "김치찌개", "quantity": 2, "unit_price": 8000, "subtotal": 16000 }
  ],
  "total_amount": 16000,
  "created_at": "2026-04-01T12:00:00Z"
}
```

### 2.10 login_attempts (로그인 시도)

| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| id | SERIAL | PK | 고유 ID |
| identifier | VARCHAR(100) | UNIQUE, NOT NULL | 식별자 (store_id:username) |
| attempt_count | INTEGER | NOT NULL, DEFAULT 0 | 시도 횟수 |
| last_attempt_at | TIMESTAMP | NULL | 마지막 시도 시각 |
| locked_until | TIMESTAMP | NULL | 잠금 해제 시각 |

---

## 3. 인덱스 전략

| 테이블 | 인덱스 | 타입 | 용도 |
|--------|--------|------|------|
| admin_users | (username) | UNIQUE | 로그인 조회 |
| tables | (table_number) | UNIQUE | 테이블 인증 |
| table_sessions | (table_id, status) | INDEX | 활성 세션 조회 |
| table_sessions | (expires_at) | INDEX | 만료 세션 조회 |
| categories | (name) | UNIQUE | 카테고리 중복 방지 |
| categories | (display_order) | INDEX | 순서 정렬 조회 |
| menu_items | (category_id, display_order) | INDEX | 카테고리별 메뉴 정렬 |
| orders | (session_id, is_deleted) | INDEX | 세션별 주문 조회 |
| orders | (table_id, is_deleted) | INDEX | 테이블별 주문 조회 |
| orders | (is_deleted, created_at) | INDEX | 주문 시간순 조회 |
| order_items | (order_id) | INDEX | 주문별 항목 조회 |
| order_history | (table_id, completed_at) | INDEX | 테이블별 이력 날짜 조회 |
| order_history | (completed_at) | INDEX | 이력 날짜 조회 |
| login_attempts | (identifier) | UNIQUE | 로그인 시도 조회 |
