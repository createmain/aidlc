# Backend - API 명세서

> Frontend 유닛 참조용. 모든 엔드포인트, 요청/응답 형식, 인증 요구사항, 에러 코드를 정의합니다.

---

## 공통 사항

### Base URL
```
/api
```

### 인증 방식
- JWT Bearer Token: `Authorization: Bearer <token>`
- 역할 기반 접근 제어:
  - `admin` — 관리자 전용 API
  - `table` — 고객(테이블) 전용 API
  - `public` — 인증 불필요

### 공통 에러 응답 형식
```json
{
  "error": "ERROR_CODE",
  "message": "사용자 친화적 메시지",
  "details": []
}
```

### HTTP 상태 코드
| 코드 | 의미 | error 코드 |
|------|------|-----------|
| 200 | 성공 | - |
| 201 | 생성 성공 | - |
| 400 | 입력 검증 실패 | VALIDATION_ERROR |
| 401 | 인증 실패/토큰 만료 | AUTH_ERROR |
| 403 | 권한 없음 | FORBIDDEN |
| 404 | 리소스 없음 | NOT_FOUND |
| 409 | 상태 충돌 | STATE_ERROR |
| 423 | 계정 잠금 | ACCOUNT_LOCKED |
| 500 | 서버 오류 | INTERNAL_ERROR |

---

## 1. Auth API

### 1.1 관리자 로그인
```
POST /api/auth/login
```
- 인증: `public`

**Request Body**
```json
{
  "storeIdentifier": "string (필수)",
  "username": "string (필수, 1~50자)",
  "password": "string (필수)"
}
```

**Response 200**
```json
{
  "token": "string (JWT)",
  "expiresIn": "16h"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 401 | AUTH_ERROR | 매장 식별자/사용자명/비밀번호 불일치 |
| 423 | ACCOUNT_LOCKED | 5회 실패 후 15분 잠금 (retryAfter: 분) |

---

### 1.2 테이블 태블릿 인증
```
POST /api/auth/table-login
```
- 인증: `public`

**Request Body**
```json
{
  "storeIdentifier": "string (필수)",
  "tableNumber": "integer (필수, > 0)",
  "password": "string (필수)"
}
```

**Response 200**
```json
{
  "token": "string (JWT)",
  "expiresIn": "number (세션 남은 시간, 초)",
  "tableId": "integer",
  "sessionId": "integer"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 401 | AUTH_ERROR | 매장 식별자/비밀번호 불일치 |
| 404 | NOT_FOUND | 테이블 정보 없음 |
| 409 | STATE_ERROR | 활성 세션 없음 — 세션 미생성 (관리자 초기 설정 필요) |
| 409 | STATE_ERROR | 세션 만료 — expires_at 초과 (관리자 재설정 필요) |
| 409 | STATE_ERROR | 세션 완료 — 이용 완료 처리됨 (관리자 재설정 필요) |

---

## 2. Menu API

### 2.1 메뉴 목록 조회
```
GET /api/menus?categoryId={categoryId}
```
- 인증: `table` 또는 `admin`
- Query: `categoryId` (선택) — 카테고리 필터
- 정렬: `displayOrder ASC`

**Response 200**
```json
{
  "menus": [
    {
      "id": "integer",
      "categoryId": "integer",
      "categoryName": "string",
      "name": "string",
      "price": "integer (원)",
      "description": "string | null",
      "imagePath": "string | null",
      "displayOrder": "integer"
    }
  ]
}
```

---

### 2.2 메뉴 상세 조회
```
GET /api/menus/:menuId
```
- 인증: `table` 또는 `admin`

**Response 200**
```json
{
  "id": "integer",
  "categoryId": "integer",
  "categoryName": "string",
  "name": "string",
  "price": "integer (원)",
  "description": "string | null",
  "imagePath": "string | null",
  "displayOrder": "integer",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 404 | NOT_FOUND | 메뉴 없음 |

---

### 2.3 메뉴 등록
```
POST /api/menus
```
- 인증: `admin`
- Content-Type: `multipart/form-data`

**Request Body (form-data)**
| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| name | string | ✅ | 메뉴명 (1~100자) |
| price | integer | ✅ | 가격 (>= 0, 원 단위) |
| description | string | | 메뉴 설명 |
| categoryId | integer | ✅ | 카테고리 ID |
| image | file | | 이미지 (jpg/jpeg/png/gif/webp, 최대 5MB) |

**Response 201**
```json
{
  "id": "integer",
  "categoryId": "integer",
  "name": "string",
  "price": "integer",
  "description": "string | null",
  "imagePath": "string | null",
  "displayOrder": "integer",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 400 | VALIDATION_ERROR | 필수 필드 누락, 가격 음수, 이미지 형식/크기 초과 |
| 404 | NOT_FOUND | categoryId에 해당하는 카테고리 없음 |

---

### 2.4 메뉴 수정
```
PUT /api/menus/:menuId
```
- 인증: `admin`
- Content-Type: `multipart/form-data`

**Request Body (form-data)**
| 필드 | 타입 | 필수 | 설명 |
|------|------|:----:|------|
| name | string | | 메뉴명 (1~100자) |
| price | integer | | 가격 (>= 0) |
| description | string | | 메뉴 설명 |
| categoryId | integer | | 카테고리 ID |
| image | file | | 새 이미지 (기존 이미지 교체) |

**Response 200**
```json
{
  "id": "integer",
  "categoryId": "integer",
  "name": "string",
  "price": "integer",
  "description": "string | null",
  "imagePath": "string | null",
  "displayOrder": "integer",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 400 | VALIDATION_ERROR | 입력 검증 실패 |
| 404 | NOT_FOUND | 메뉴 또는 카테고리 없음 |

---

### 2.5 메뉴 삭제
```
DELETE /api/menus/:menuId
```
- 인증: `admin`

**Response 200**
```json
{
  "message": "메뉴가 삭제되었습니다"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 404 | NOT_FOUND | 메뉴 없음 |

---

### 2.6 메뉴 노출 순서 변경
```
PUT /api/menus/order
```
- 인증: `admin`

**Request Body**
```json
{
  "orders": [
    { "id": "integer (메뉴 ID)", "displayOrder": "integer" }
  ]
}
```

**Response 200**
```json
{
  "message": "메뉴 순서가 변경되었습니다"
}
```

---

### 2.7 카테고리 목록 조회
```
GET /api/categories
```
- 인증: `table` 또는 `admin`
- 정렬: `displayOrder ASC`

**Response 200**
```json
{
  "categories": [
    {
      "id": "integer",
      "name": "string",
      "displayOrder": "integer",
      "isDefault": "boolean"
    }
  ]
}
```

---

### 2.8 카테고리 등록
```
POST /api/categories
```
- 인증: `admin`

**Request Body**
```json
{
  "name": "string (필수, 1~50자)"
}
```

**Response 201**
```json
{
  "id": "integer",
  "name": "string",
  "displayOrder": "integer",
  "isDefault": false,
  "createdAt": "ISO 8601"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 400 | VALIDATION_ERROR | 이름 누락 또는 중복 |

---

### 2.9 카테고리 수정
```
PUT /api/categories/:categoryId
```
- 인증: `admin`

**Request Body**
```json
{
  "name": "string (필수, 1~50자)"
}
```

**Response 200**
```json
{
  "id": "integer",
  "name": "string",
  "displayOrder": "integer",
  "isDefault": "boolean",
  "createdAt": "ISO 8601"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 400 | VALIDATION_ERROR | 이름 중복 |
| 404 | NOT_FOUND | 카테고리 없음 |

---

### 2.10 카테고리 삭제
```
DELETE /api/categories/:categoryId
```
- 인증: `admin`
- 소속 메뉴가 있으면 미분류 카테고리(is_default=TRUE)로 자동 이동

**Response 200**
```json
{
  "message": "카테고리가 삭제되었습니다",
  "movedMenuCount": "integer (미분류로 이동된 메뉴 수)"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 400 | VALIDATION_ERROR | 기본(미분류) 카테고리 삭제 시도 |
| 404 | NOT_FOUND | 카테고리 없음 |

---

### 2.11 카테고리 노출 순서 변경
```
PUT /api/categories/order
```
- 인증: `admin`

**Request Body**
```json
{
  "orders": [
    { "id": "integer (카테고리 ID)", "displayOrder": "integer" }
  ]
}
```

**Response 200**
```json
{
  "message": "카테고리 순서가 변경되었습니다"
}
```

---

## 3. Order API

### 3.1 주문 생성
```
POST /api/orders
```
- 인증: `table`

**Request Body**
```json
{
  "items": [
    {
      "menuItemId": "integer (필수)",
      "quantity": "integer (필수, > 0)"
    }
  ]
}
```
- `tableId`, `sessionId`는 JWT 토큰에서 추출 (요청 본문에 포함하지 않음)

**Response 201**
```json
{
  "id": "integer",
  "orderNumber": "string (ORD-YYYYMMDD-순번)",
  "tableId": "integer",
  "sessionId": "integer",
  "status": "pending",
  "items": [
    {
      "id": "integer",
      "menuItemId": "integer",
      "menuName": "string (스냅샷)",
      "quantity": "integer",
      "unitPrice": "integer (스냅샷)",
      "subtotal": "integer"
    }
  ],
  "totalAmount": "integer",
  "createdAt": "ISO 8601"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 400 | VALIDATION_ERROR | items 비어있음, 수량 0 이하, 메뉴 ID 없음 |
| 404 | NOT_FOUND | menuItemId에 해당하는 메뉴 없음 |
| 409 | STATE_ERROR | 유효한 세션 없음 / 세션 만료 / 세션 완료 |

---

### 3.2 세션별 주문 목록 조회
```
GET /api/orders?sessionId={sessionId}
```
- 인증: `table`
- `sessionId`는 JWT 토큰에서 추출 가능 (쿼리 파라미터 생략 시 현재 세션)

**Response 200**
```json
{
  "orders": [
    {
      "id": "integer",
      "orderNumber": "string",
      "status": "pending | preparing | completed",
      "items": [
        {
          "id": "integer",
          "menuName": "string",
          "quantity": "integer",
          "unitPrice": "integer",
          "subtotal": "integer"
        }
      ],
      "totalAmount": "integer",
      "createdAt": "ISO 8601",
      "updatedAt": "ISO 8601"
    }
  ]
}
```
- 논리 삭제(is_deleted=TRUE) 및 아카이브(is_archived=TRUE) 주문 제외
- createdAt DESC 정렬

---

### 3.3 테이블별 주문 목록 조회
```
GET /api/orders?tableId={tableId}
```
- 인증: `admin`

**Response 200** — 3.2와 동일 형식
- 논리 삭제(is_deleted=TRUE) 및 아카이브(is_archived=TRUE) 주문 제외
- createdAt DESC 정렬

---

### 3.4 주문 상태 변경
```
PATCH /api/orders/:orderId/status
```
- 인증: `admin`

**Request Body**
```json
{
  "status": "pending | preparing | completed"
}
```

**허용 전이**
| 현재 → 변경 | 허용 |
|-------------|:----:|
| pending → preparing | ✅ |
| preparing → completed | ✅ |
| preparing → pending | ✅ |
| completed → * | ❌ |
| pending → completed | ❌ |

**Response 200**
```json
{
  "id": "integer",
  "orderNumber": "string",
  "status": "string (변경된 상태)",
  "updatedAt": "ISO 8601"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 404 | NOT_FOUND | 주문 없음 |
| 409 | STATE_ERROR | 논리 삭제된 주문 (is_deleted=TRUE) |
| 409 | STATE_ERROR | 완료된 주문 상태 변경 불가 (completed는 종착 상태) |
| 409 | STATE_ERROR | 허용되지 않는 상태 전이 (예: pending → completed) |

---

### 3.5 주문 삭제 (논리 삭제)
```
DELETE /api/orders/:orderId
```
- 인증: `admin`

**Response 200**
```json
{
  "message": "주문이 삭제되었습니다",
  "newTableTotal": "integer (재계산된 테이블 총 주문액)"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 404 | NOT_FOUND | 주문 없음 |
| 409 | STATE_ERROR | 이미 삭제된 주문 |

---

## 4. Table API

### 4.1 테이블 목록 조회
```
GET /api/tables
```
- 인증: `admin`

**Response 200**
```json
{
  "tables": [
    {
      "id": "integer",
      "tableNumber": "integer",
      "sessionStatus": "active | completed | expired | null",
      "orderCount": "integer (현재 활성 주문 수)",
      "totalAmount": "integer (현재 총 주문액)"
    }
  ]
}
```
- `sessionStatus: null` — 세션이 한 번도 생성되지 않은 테이블

---

### 4.2 테이블 초기 설정
```
POST /api/tables/setup
```
- 인증: `admin`

**Request Body**
```json
{
  "tableNumber": "integer (필수, > 0)",
  "password": "string (필수)"
}
```
- 기존 테이블이면 비밀번호 업데이트 + 기존 활성 세션 완료 처리(status='completed') + 새 세션 생성
- 새 테이블이면 테이블 생성 + 세션 생성
- 미분류 카테고리(is_default=TRUE) 존재 여부 확인 — 없으면 서버 경고 로그 출력

**Response 201**
```json
{
  "tableId": "integer",
  "tableNumber": "integer",
  "sessionId": "integer",
  "sessionExpiresAt": "ISO 8601 (NOW + 16h)"
}
```

---

### 4.3 이용 완료 (세션 종료)
```
POST /api/tables/:tableId/complete
```
- 인증: `admin`

**처리 순서**
1. 활성 세션 확인
2. 현재 주문 조회 (is_deleted=FALSE, is_archived=FALSE인 주문만 대상)
3. 대상 주문 → order_history로 복사 (JSON 스냅샷)
4. 원본 주문 is_archived = TRUE
5. 세션 status = 'completed', completed_at = NOW()
6. Realtime 이벤트 발행: `session-completed`

**Response 200**
```json
{
  "message": "이용 완료 처리되었습니다",
  "tableId": "integer",
  "completedAt": "ISO 8601"
}
```

**에러**
| 상태 | error | 조건 |
|------|-------|------|
| 409 | STATE_ERROR | 활성 세션 없음 |

---

### 4.4 과거 주문 내역 조회
```
GET /api/tables/:tableId/history?from={date}&to={date}
```
- 인증: `admin`
- Query: `from`, `to` (선택, ISO 8601 날짜)

**Response 200**
```json
{
  "history": [
    {
      "id": "integer",
      "sessionId": "integer",
      "orderSnapshot": {
        "order_id": "integer",
        "order_number": "string",
        "status": "string",
        "items": [
          {
            "menu_name": "string",
            "quantity": "integer",
            "unit_price": "integer",
            "subtotal": "integer"
          }
        ],
        "total_amount": "integer",
        "created_at": "ISO 8601"
      },
      "totalAmount": "integer",
      "orderedAt": "ISO 8601",
      "completedAt": "ISO 8601"
    }
  ]
}
```
- completedAt DESC 정렬

---

### 4.5 테이블 현재 상태 조회
```
GET /api/tables/:tableId/status
```
- 인증: `admin`

**Response 200**
```json
{
  "tableId": "integer",
  "tableNumber": "integer",
  "sessionStatus": "active | completed | expired | null",
  "orderCount": "integer",
  "totalAmount": "integer"
}
```

---

## 5. Realtime API (SSE)

### 5.1 관리자 실시간 구독
```
GET /api/realtime/subscribe
```
- 인증: `admin`
- Response: `text/event-stream`

**SSE 이벤트 형식**
```
event: {eventType}
data: {JSON 문자열}

```

**이벤트 타입**

#### new-order
```json
{
  "orderId": "integer",
  "tableId": "integer",
  "tableNumber": "integer",
  "orderNumber": "string",
  "items": [
    {
      "menuName": "string",
      "quantity": "integer",
      "unitPrice": "integer",
      "subtotal": "integer"
    }
  ],
  "totalAmount": "integer"
}
```

#### order-status-changed
```json
{
  "orderId": "integer",
  "tableId": "integer",
  "previousStatus": "string",
  "newStatus": "string"
}
```

#### order-deleted
```json
{
  "orderId": "integer",
  "tableId": "integer",
  "newTableTotal": "integer"
}
```

#### session-completed
```json
{
  "tableId": "integer",
  "completedAt": "ISO 8601"
}
```

---

### 5.2 고객 실시간 구독 (선택사항)
```
GET /api/realtime/subscribe/customer
```
- 인증: `table`
- Response: `text/event-stream`
- 해당 테이블 관련 이벤트만 수신 (order-status-changed)

---

## 6. 정적 파일 서빙

### 6.1 메뉴 이미지 서빙
```
GET /uploads/images/{categoryName}/{filename}
```
- 인증: 불필요 (정적 파일)
- Express/Fastify static middleware를 통해 `uploads/` 디렉토리를 정적 서빙
- 저장 경로 규칙: `uploads/images/{categoryName}/{uuid}.{ext}`
- 허용 확장자: jpg, jpeg, png, gif, webp
- 메뉴의 `imagePath` 필드 값이 이 경로를 가리킴

---

## 7. 라우트 요약

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/auth/login | public | 관리자 로그인 |
| POST | /api/auth/table-login | public | 테이블 인증 |
| GET | /api/menus | table/admin | 메뉴 목록 조회 |
| GET | /api/menus/:menuId | table/admin | 메뉴 상세 조회 |
| POST | /api/menus | admin | 메뉴 등록 |
| PUT | /api/menus/:menuId | admin | 메뉴 수정 |
| DELETE | /api/menus/:menuId | admin | 메뉴 삭제 |
| PUT | /api/menus/order | admin | 메뉴 순서 변경 |
| GET | /api/categories | table/admin | 카테고리 목록 |
| POST | /api/categories | admin | 카테고리 등록 |
| PUT | /api/categories/:categoryId | admin | 카테고리 수정 |
| DELETE | /api/categories/:categoryId | admin | 카테고리 삭제 |
| PUT | /api/categories/order | admin | 카테고리 순서 변경 |
| POST | /api/orders | table | 주문 생성 |
| GET | /api/orders | table/admin | 주문 목록 조회 |
| PATCH | /api/orders/:orderId/status | admin | 주문 상태 변경 |
| DELETE | /api/orders/:orderId | admin | 주문 삭제 |
| GET | /api/tables | admin | 테이블 목록 |
| POST | /api/tables/setup | admin | 테이블 초기 설정 |
| POST | /api/tables/:tableId/complete | admin | 이용 완료 |
| GET | /api/tables/:tableId/history | admin | 과거 주문 내역 |
| GET | /api/tables/:tableId/status | admin | 테이블 상태 조회 |
| GET | /api/realtime/subscribe | admin | 관리자 SSE 구독 |
| GET | /api/realtime/subscribe/customer | table | 고객 SSE 구독 (선택) |
| GET | /uploads/images/** | public | 메뉴 이미지 정적 서빙 |
