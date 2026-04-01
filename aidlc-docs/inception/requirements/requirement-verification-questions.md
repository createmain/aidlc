# 요구사항 확인 질문

제공해주신 테이블오더 서비스 요구사항을 분석했습니다. 아래 질문에 답변해주시면 더 정확한 요구사항 정의가 가능합니다.
각 질문의 `[Answer]:` 태그 뒤에 선택지 알파벳을 입력해주세요.

---

## Question 1
백엔드 기술 스택으로 어떤 것을 선호하시나요?

A) Node.js + Express/Fastify (JavaScript/TypeScript)
B) Spring Boot (Java/Kotlin)
C) Django/FastAPI (Python)
D) Go (Gin/Echo)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 2
프론트엔드 기술 스택으로 어떤 것을 선호하시나요?

A) React (JavaScript/TypeScript)
B) Vue.js
C) Next.js (React 기반 풀스택)
D) Svelte/SvelteKit
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
데이터베이스로 어떤 것을 사용하시겠습니까?

A) PostgreSQL
B) MySQL/MariaDB
C) MongoDB (NoSQL)
D) SQLite (경량, 개발/소규모 매장용)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 4
이 서비스는 단일 매장용인가요, 다중 매장(멀티테넌트)용인가요?

A) 단일 매장 전용 (하나의 매장만 운영)
B) 다중 매장 지원 (여러 매장이 각각 독립적으로 운영)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 5
배포 환경은 어떻게 계획하고 계신가요?

A) 클라우드 (AWS, GCP, Azure 등)
B) 자체 서버 (On-premises)
C) Docker 컨테이너 기반 (배포 환경 미정)
D) 로컬 개발 환경만 우선 구축 (배포는 나중에 결정)
X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 6
메뉴 이미지 관리는 어떻게 하시겠습니까? (요구사항에 이미지 URL이 언급되어 있습니다)

A) 외부 이미지 URL 직접 입력 (별도 업로드 없음)
B) 서버에 이미지 파일 업로드 기능 포함
C) 클라우드 스토리지 (S3 등) 연동 이미지 업로드
D) MVP에서는 이미지 URL 직접 입력, 추후 업로드 기능 추가
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 7
관리자 계정 관리는 어떻게 하시겠습니까?

A) 시스템 초기 설정 시 관리자 계정 1개 생성 (고정)
B) 매장별 관리자 계정 등록/관리 기능 포함
C) 환경변수 또는 설정 파일로 관리자 계정 설정
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 8
동시 접속 규모는 어느 정도를 예상하시나요? (매장당 테이블 수 기준)

A) 소규모 (10개 이하 테이블)
B) 중규모 (10~30개 테이블)
C) 대규모 (30개 이상 테이블)
D) 규모 미정 (확장 가능한 구조로 설계)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 9
메뉴 관리 기능을 MVP에 포함하시겠습니까? (요구사항 3.2.4에 정의되어 있으나 MVP 범위 섹션에는 명시되지 않았습니다)

A) MVP에 포함 (메뉴 CRUD 기능 구현)
B) MVP에서 제외 (초기 데이터는 시드 데이터로 투입)
C) 기본적인 메뉴 등록/수정만 포함 (순서 조정 등 고급 기능 제외)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 10
프로젝트 구조는 어떤 방식을 선호하시나요?

A) 모노레포 (프론트엔드 + 백엔드를 하나의 저장소에서 관리)
B) 분리된 저장소 (프론트엔드와 백엔드를 별도 프로젝트로)
X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Question: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended for production-grade applications)
B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)
X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (recommended for projects with business logic, data transformations, serialization, or stateful components)
B) Partial — enforce PBT rules only for pure functions and serialization round-trips (suitable for projects with limited algorithmic complexity)
C) No — skip all PBT rules (suitable for simple CRUD applications, UI-only projects, or thin integration layers with no significant business logic)
X) Other (please describe after [Answer]: tag below)

[Answer]: C
