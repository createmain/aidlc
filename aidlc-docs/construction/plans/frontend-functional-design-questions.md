# Frontend Functional Design 질문

아래 질문에 답변해 주세요. 각 질문의 [Answer]: 태그 뒤에 선택지 문자를 입력해 주세요.

---

## Question 1
고객 UI의 메뉴 화면에서 카테고리 탐색 방식을 어떻게 구현할까요?

A) 상단 탭 바 (가로 스크롤, 카테고리 선택 시 해당 메뉴 필터링)
B) 사이드바 (좌측 카테고리 목록, 우측 메뉴 카드)
C) 전체 카테고리를 세로 섹션으로 나열 (한 페이지에 모든 카테고리 + 메뉴 표시, 앵커 이동)
D) Other (please describe after [Answer]: tag below)

[Answer]: B
---

## Question 2
고객 UI에서 메뉴 상세 정보를 어떻게 표시할까요?

A) 모달/바텀시트 (현재 화면 위에 오버레이로 표시, 닫기 버튼으로 복귀)
B) 별도 상세 페이지 (라우팅 이동, 뒤로가기로 복귀)
C) 카드 확장 (선택한 카드가 인라인으로 확장되어 상세 표시)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 3
고객 UI의 장바구니 접근 방식을 어떻게 구현할까요?

A) 하단 고정 바 (장바구니 아이템 수 + 총 금액 항상 표시, 터치 시 장바구니 화면 이동)
B) 플로팅 버튼 (화면 우하단 FAB, 뱃지로 수량 표시)
C) 별도 탭/네비게이션 (하단 네비게이션 바에 장바구니 탭)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 4
관리자 대시보드의 테이블 카드 레이아웃에서 주문 상태 변경 UI를 어떻게 구현할까요?

A) 테이블 카드 클릭 → 주문 목록 패널(사이드 또는 모달) → 각 주문별 상태 변경 버튼
B) 테이블 카드 클릭 → 별도 주문 상세 페이지 이동 → 상태 변경 버튼
C) 테이블 카드 내에서 직접 주문 목록 펼침(아코디언) → 인라인 상태 변경
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 5
관리자 UI의 전체 네비게이션 구조를 어떻게 구성할까요?

A) 상단 헤더 + 좌측 사이드바 (대시보드, 테이블 관리, 메뉴 관리, 과거 내역)
B) 상단 헤더 + 탭 네비게이션 (상단 탭으로 주요 메뉴 전환)
C) 좌측 사이드바만 (헤더 없이 사이드바에서 모든 네비게이션)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 6
관리자 대시보드에서 신규 주문 알림의 시각적 강조 방식을 어떻게 할까요?

A) 테이블 카드 배경색 변경 + 짧은 펄스 애니메이션 (2~3초 후 정상 복귀)
B) 테이블 카드 테두리 강조 + 뱃지("NEW") 표시 (관리자가 확인할 때까지 유지)
C) 토스트 알림 + 테이블 카드 하이라이트 (토스트는 자동 사라짐, 카드는 확인 시까지 유지)
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 7
API 통신 에러 발생 시 사용자에게 보여줄 에러 처리 UI 패턴을 어떻게 할까요?

A) 토스트/스낵바 (화면 하단 또는 상단에 일시적 메시지, 자동 사라짐)
B) 인라인 에러 (해당 영역에 에러 메시지 직접 표시)
C) 토스트 + 인라인 혼합 (일반 에러는 토스트, 폼 검증 에러는 인라인)
D) Other (please describe after [Answer]: tag below)

[Answer]: C

---

## Question 8
관리자 메뉴 관리 화면에서 메뉴 노출 순서 변경 UI를 어떻게 구현할까요?

A) 드래그 앤 드롭 (메뉴 항목을 드래그하여 순서 변경)
B) 위/아래 화살표 버튼 (각 메뉴 옆에 순서 이동 버튼)
C) 순서 번호 직접 입력 (각 메뉴에 숫자 입력 필드)
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 9
고객 UI와 관리자 UI 간의 시각적 테마 구분을 어떻게 할까요?

A) 동일 디자인 시스템, 색상 테마만 다르게 (고객: 밝은/따뜻한 톤, 관리자: 차분한/전문적 톤)
B) 완전히 다른 레이아웃과 스타일 (고객: 카드 중심 모바일 최적화, 관리자: 데스크톱 대시보드)
C) 동일 디자인 시스템, 동일 테마 (구분 없이 통일)
D) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Question 10
CSS 스타일링 방식을 어떻게 할까요?

A) CSS Modules (컴포넌트별 스코프 CSS)
B) Tailwind CSS (유틸리티 퍼스트)
C) styled-components / Emotion (CSS-in-JS)
D) 일반 CSS/SCSS 파일
E) Other (please describe after [Answer]: tag below)

[Answer]: C, 그리고 material ui design 적용해

---

## Question 11
고객 UI에서 주문 성공 후 5초 카운트다운 중 사용자가 다른 행동을 하면 어떻게 처리할까요?

A) 카운트다운 취소 — 사용자가 화면을 터치하거나 다른 곳으로 이동하면 자동 리다이렉트 취소
B) 카운트다운 유지 — 사용자 행동과 무관하게 5초 후 무조건 메뉴 화면으로 이동
C) "메뉴로 돌아가기" 버튼 제공 — 자동 리다이렉트 없이 사용자가 직접 이동
D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question 12
관리자 대시보드에서 Realtime(SSE) 연결 상태를 사용자에게 어떻게 표시할까요?

A) 헤더에 연결 상태 인디케이터 (초록 점: 연결됨, 빨간 점: 끊김, 재연결 중 표시)
B) 연결 끊김 시에만 배너 알림 (정상 시에는 표시 없음)
C) 별도 표시 없음 (자동 재연결에 의존, 사용자에게 노출하지 않음)
D) Other (please describe after [Answer]: tag below)

[Answer]: A
