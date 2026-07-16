# Architecture Linter Rules (v1.1)

## [Rule 006] Semantic Naming Validator
이름은 역할과 의미를 설명해야 합니다. 문법 검사를 넘어 의미론적 검사를 수행합니다.
- **Good Examples**: `messages`, `houses`, `opportunities`
- **Bad Examples**: `message_data`, `corehub_engine`, `new_table`

## [Rule 007] Connector Responsibility
커넥터는 외부 시스템과의 통신만을 담당하며, 비즈니스 로직을 소유할 수 없습니다. 로직 비대화 감지 시 경고를 발생시킵니다.

## [Rule 008] Architecture Drift Detection
프로젝트가 원래의 철학(Constitution)에서 멀어지는 것을 감지합니다.
- **감지 항목**: ctx 계약 위반 증가, Message 외 구조 생성 시도, ADR 없는 스키마 변경.
