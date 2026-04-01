# Backend - 비즈니스 규칙

---

## 1. 검증 규칙 (Validation Rules)

### 1.1 입력 검증

| 모듈 | 필드 | 규칙 |
|------|------|------|
| Auth | storeId | 필수, 문자열 |
| Auth | username | 필수, 1~50자 |
| Auth | password | 필수, 1~255자 |
| Menu | name | 필수, 1~100자 |
| Menu | price | 필수, 정수, >= 0 |
| Menu | categoryId | 필수, 존재하는 카테고리 ID |
| Menu | description | 선택, TEXT |
| Menu | imageFile | 선택, 허용 확장자: jpg, jpeg, png, gif, webp |
| Menu | imageFile 크기 | 최대 5MB |
| Category | name | 필수, 1~50자, 매장 내 중복 불가 |
| Order | items | 필수, 1개 이상 |
| Order | items[].menuItemId | 필수, 존재하는 메뉴 ID |
| Order | items[].quantity | 필수, 정수, > 0 |
| Table | tableNumber | 필수, 정수, > 0 |
| Table | password | 필수, 1~255자 |

### 1.2 상태 검증

| 검증 대상 | 규칙 | 에러 메시지 |
|-----------|------|-------------|
| 테이블 세션 | 주문 생성 시 활성 세션 필수 | "유효한 테이블 세션이 없습니다" |
| 테이블 세션 | 만료된 세션으로 주문 불가 | "세션이 만료되었습니다. 관리자에게 문의하세요" |
| 주문 상태 변경 | 논리 삭제된 주문 상태 변경 불가 | "삭제된 주문입니다" |
| 주문 삭제 | 이미 삭제된 주문 재삭제 불가 | "이미 삭제된 주문입니다" |
| 카테고리 삭제 | 미분류(기본) 카테고리 삭제 불가 | "기본 카테고리는 삭제할 수 없습니다" |
| 로그인 | 잠금 상태에서 로그인 불가 | "계정이 잠금되었습니다. {남은시간}분 후 다시 시도하세요" |

---

## 2. 상태 전이 규칙

### 2.1 주문 상태 전이

```
허용 전이 매트릭스:

         → pending  preparing  completed
pending     -         ✅         ❌
preparing   ✅        -          ✅
completed   ❌        ✅         -
```

| 전이 | 허용 | 설명 |
|------|:----:|------|
| pending → preparing | ✅ | 준비 시작 |
| preparing → completed | ✅ | 준비 완료 |
| preparing → pending | ✅ | 준비 취소 (대기로 복귀) |
| completed → preparing | ✅ | 완료 취소 (준비중으로 복귀) |
| pending → completed | ❌ | 직접 완료 불가 (preparing 거쳐야 함) |
| completed → pending | ❌ | 완료에서 대기로 직접 복귀 불가 |

### 2.2 테이블 세션 상태

| 상태 | 전이 조건 | 설명 |
|------|-----------|------|
| active | 초기 설정 시 생성 | 주문 가능 상태 |
| expired | expires_at < NOW() | 만료 (조회 시 판정) |
| active → expired | 관리자 재설정 시 기존 세션 | 새 세션 생성으로 대체 |

---

## 3. 비즈니스 제약 조건

### 3.1 매장 제약

| 제약 | 값 | 설명 |
|------|-----|------|
| 관리자 계정 수 | 1개 고정 | 시스템 초기화 시 자동 생성 |
| 테이블 수 | 최대 10개 | 소규모 매장 |
| 세션 유효 시간 | 16시간 | 관리자 JWT도 동일 |

### 3.2 주문 제약

| 제약 | 규칙 |
|------|------|
| 주문 항목 수 | 최소 1개 이상 |
| 주문 번호 형식 | ORD-{YYYYMMDD}-{순번} |
| 주문 번호 순번 | 매장별 일일 리셋 |
| 가격 스냅샷 | 주문 시점의 메뉴명/단가 저장 (이후 메뉴 변경 영향 없음) |

### 3.3 이미지 제약

| 제약 | 값 |
|------|-----|
| 허용 확장자 | jpg, jpeg, png, gif, webp |
| 최대 파일 크기 | 5MB |
| 저장 경로 | uploads/images/{categoryName}/{uuid}.{ext} |
| 파일명 | UUID v4 기반 (충돌 방지) |

### 3.4 메뉴 노출 순서

| 제약 | 규칙 |
|------|------|
| 초기값 | MAX(display_order) + 100 |
| 간격 | 100 단위 |
| 변경 방식 | 클라이언트에서 전체 순서 배열 전송, 서버에서 일괄 업데이트 |

---

## 4. 에러 처리 규칙

### 4.1 HTTP 상태 코드 매핑

| 상황 | 상태 코드 | 응답 형식 |
|------|-----------|-----------|
| 입력 검증 실패 | 400 Bad Request | `{ error: "VALIDATION_ERROR", message: "...", details: [...] }` |
| 인증 실패 | 401 Unauthorized | `{ error: "AUTH_ERROR", message: "..." }` |
| 권한 없음 | 403 Forbidden | `{ error: "FORBIDDEN", message: "..." }` |
| 리소스 없음 | 404 Not Found | `{ error: "NOT_FOUND", message: "..." }` |
| 상태 전이 불가 | 409 Conflict | `{ error: "STATE_ERROR", message: "..." }` |
| 계정 잠금 | 423 Locked | `{ error: "ACCOUNT_LOCKED", message: "...", retryAfter: minutes }` |
| 서버 오류 | 500 Internal Server Error | `{ error: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다" }` |

### 4.2 에러 응답 표준 형식

```json
{
  "error": "ERROR_CODE",
  "message": "사용자 친화적 메시지",
  "details": []
}
```

- `error`: 프로그래밍용 에러 코드 (대문자 스네이크 케이스)
- `message`: 사용자에게 표시할 메시지 (한글)
- `details`: 검증 에러 시 필드별 상세 (선택)

### 4.3 트랜잭션 규칙

| 작업 | 트랜잭션 범위 |
|------|---------------|
| 주문 생성 | orders + order_items INSERT를 단일 트랜잭션 |
| 이용 완료 | order_history INSERT + orders UPDATE(is_archived) + session UPDATE를 단일 트랜잭션 |
| 메뉴 노출 순서 변경 | 전체 순서 UPDATE를 단일 트랜잭션 |
| 카테고리 삭제 | 메뉴 category_id 변경 + 카테고리 DELETE를 단일 트랜잭션 |

### 4.4 동시성 규칙

| 상황 | 처리 방식 |
|------|-----------|
| 동일 테이블 동시 주문 | 각 주문 독립 순차 처리 (별도 주문 번호) |
| 주문 상태 동시 변경 | DB 레벨 행 잠금 (SELECT FOR UPDATE) |
| 총액 재계산 | 쿼리 시점 SUM 계산 (캐시 없음) |
