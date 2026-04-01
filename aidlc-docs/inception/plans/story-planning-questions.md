# User Stories Planning - 질문

아래 질문에 답변해 주세요. 각 질문의 `[Answer]:` 태그 뒤에 선택지 알파벳을 입력해 주세요.
선택지 중 맞는 것이 없으면 마지막 옵션(Other)을 선택하고 설명을 추가해 주세요.

---

## Question 1
스토리 분류(Breakdown) 방식을 어떻게 구성할까요?

A) User Journey 기반 - 사용자 흐름 순서대로 (예: 메뉴 탐색 → 장바구니 → 주문 → 조회)
B) Feature 기반 - 시스템 기능 단위로 (예: 메뉴 관리, 주문 관리, 세션 관리)
C) Persona 기반 - 사용자 유형별로 (예: 고객 스토리 묶음, 관리자 스토리 묶음)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
스토리의 세분화 수준(Granularity)을 어떻게 할까요?

A) 큰 단위 (Epic 수준) - 기능 영역당 1~2개 스토리 (예: "고객은 메뉴를 보고 주문할 수 있다")
B) 중간 단위 - 주요 기능별 1개 스토리 (예: "고객은 카테고리별로 메뉴를 탐색할 수 있다")
C) 세밀한 단위 - 세부 동작별 스토리 (예: "고객은 장바구니에서 수량을 증가시킬 수 있다")
D) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 3
Acceptance Criteria(수용 기준) 형식을 어떻게 작성할까요?

A) Given-When-Then (BDD 스타일) - 예: "Given 장바구니에 메뉴가 있을 때, When 주문 확정을 누르면, Then 주문이 생성된다"
B) 체크리스트 형식 - 예: "✅ 주문 번호가 표시된다 ✅ 장바구니가 비워진다"
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
스토리 우선순위 표기를 포함할까요?

A) 포함 - MoSCoW 방식 (Must/Should/Could/Won't)
B) 포함 - 숫자 우선순위 (P1, P2, P3)
C) 미포함 - 우선순위는 Workflow Planning에서 결정
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
고객 페르소나를 어떤 수준으로 정의할까요?

A) 간단한 역할 정의 - 이름, 역할, 주요 목표만 (예: "김고객 - 테이블 이용 고객, 빠르게 주문하고 싶다")
B) 상세 페르소나 - 배경, 동기, 불편사항, 기술 수준 포함
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6
관리자의 "과거 주문 내역 조회" 기능을 별도 스토리로 분리할까요, 테이블 관리 스토리에 포함할까요?

A) 별도 스토리로 분리 - 독립적으로 개발/테스트 가능하도록
B) 테이블 관리 스토리에 포함 - 테이블 관리의 하위 기능으로 묶기
C) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 7
SSE 기반 실시간 기능(주문 모니터링, 주문 상태 업데이트)을 어떻게 스토리로 구성할까요?

A) 실시간 기능을 별도 스토리로 분리 - "관리자는 실시간으로 신규 주문을 확인할 수 있다"
B) 해당 기능 스토리에 통합 - 주문 모니터링 스토리 안에 실시간 요소 포함
C) Other (please describe after [Answer]: tag below)

[Answer]: A
