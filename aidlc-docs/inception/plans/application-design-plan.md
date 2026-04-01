# Application Design Plan

## 개요
테이블오더 서비스 MVP의 컴포넌트 구조, 서비스 레이어, 의존성 관계를 설계합니다.

---

## 설계 단계

- [x] Step 1: 컴포넌트 식별 및 책임 정의 (components.md)
- [x] Step 2: 컴포넌트 메서드 시그니처 정의 (component-methods.md)
- [x] Step 3: 서비스 레이어 설계 (services.md)
- [x] Step 4: 컴포넌트 의존성 및 통신 패턴 (component-dependency.md)
- [x] Step 5: 통합 설계 문서 (application-design.md)
- [x] Step 6: 설계 완전성 및 일관성 검증

---

## 질문

아래 질문에 답변해 주세요. 각 질문의 `[Answer]:` 태그 뒤에 선택지 알파벳을 입력해 주세요.

### Question 1
백엔드 API 구조를 어떻게 구성할까요?

A) 도메인별 모듈 분리 - routes/controllers/services를 도메인(menu, order, table, auth)별로 묶기
B) 레이어별 분리 - routes/, controllers/, services/, repositories/ 폴더로 분리
C) Other (please describe after [Answer]: tag below)

[Answer]: C
A+B로 진행

### Question 2
프론트엔드를 고객용과 관리자용으로 어떻게 분리할까요?

A) 별도 React 앱 2개 - 모노레포 내 packages/customer-web, packages/admin-web
B) 단일 React 앱 + 라우팅 분리 - 하나의 앱에서 /customer, /admin 경로로 분리
C) Other (please describe after [Answer]: tag below)

[Answer]: B

### Question 3
백엔드와 프론트엔드 간 API 통신 패턴을 어떻게 할까요?

A) REST API + SSE - 일반 CRUD는 REST, 실시간은 SSE (요구사항 기반)
B) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 4
데이터 접근 레이어(Repository)를 어떻게 구성할까요?

A) ORM 사용 - Prisma 또는 TypeORM으로 DB 접근 추상화
B) Query Builder - Knex.js 등으로 SQL 직접 작성하되 빌더 패턴 활용
C) Raw SQL - pg 드라이버로 직접 SQL 작성
D) Other (please describe after [Answer]: tag below)

[Answer]: C

### Question 5
상태 관리(프론트엔드)를 어떻게 할까요?

A) React 내장 (useState/useContext) - 소규모 MVP에 적합한 경량 접근
B) 외부 라이브러리 (Zustand, Redux Toolkit 등) - 체계적 상태 관리
C) Other (please describe after [Answer]: tag below)

[Answer]: A

### Question 6
이미지 파일 업로드 시 서버 저장 경로 구조를 어떻게 할까요?

A) 단순 구조 - uploads/images/ 하위에 고유 파일명으로 저장
B) 카테고리별 구조 - uploads/images/{category}/ 하위에 저장
C) Other (please describe after [Answer]: tag below)

[Answer]: B
