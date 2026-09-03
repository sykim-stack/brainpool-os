# ADR Index

_최종 갱신: 2026-09-03_  
_용도: 탐색 전용. 결정을 재서술하지 않는다._

새 관계·구조·기능을 제안하거나 “지금 스키마에 없다”고 판단하기 전에  
이 목록을 먼저 확인한다. 상세는 각 ADR 파일을 연다.

| ID | 파일 | 핵심 한 줄 | 상태 | 관련 Core |
|----|------|------------|------|-----------|
| ACCESS-001 | [ADR-ACCESS-001.md](./ADR-ACCESS-001.md) | Room Visibility와 Access Policy 분리. family는 `corenull_house_members.room_id` 재사용. 새 participants 테이블 기각 | Active | CoreNull |
| ACCESS-002 | [ADR-ACCESS-002.md](./ADR-ACCESS-002.md) | Neighbor 성립=요청→수락. 골목=목록+입구(피드 제외). Access와 비연동 | Active | CoreNull, CoreHub |
| NEIGHBOR-000 | [ADR-NEIGHBOR-000.md](./ADR-NEIGHBOR-000.md) | Neighbor = House↔House 관계. 권한이 아님. Access와 비종속 | Active | CoreNull, CoreHub |
| CONFIRM-000 | [ADR-CONFIRM-000.md](./ADR-CONFIRM-000.md) | adopted ≠ decision. AI 채택과 사람 확정을 분리. prior_decisions는 사람 확정만 | Active | HajunAI |
| SEED-ADAPTER-000 | [ADR-SEED-ADAPTER-000.md](./ADR-SEED-ADAPTER-000.md) | Seed Adapter 제거는 날짜가 아니라 실제 주체 요구(트리거)가 생길 때 | Draft | CoreNull |
| RINGBLOCK-000 | [ADR-RINGBLOCK-000.md](./ADR-RINGBLOCK-000.md) | RingBlock 표현 계약(props)과 데이터 계산 로직 분리 | Draft | CoreNull, CoreHub |

### 번호 충돌·구분 참고
- **기존 ADR-K05** (CoreNull → HajunAI Derived Data / understanding synchronization)는 ADR-CONFIRM-000 헤더에서 존재가 언급되나, 원문 위치는 현재 레포에서 확인되지 않음. 실제 유효 여부는 별도 확인 필요.
- **이번에 작성하려던 문서**가 같은 번호(K05)를 재사용해 충돌 → **ADR-CONFIRM-000**으로 재명명.
- 현재 `doc/adr/` 폴더에는 별도 ADR-K05 파일이 없다.

### 사용 규칙
1. 새 ADR을 만들기 전에 이 표를 확인한다.
2. “이미 결정된 개념인데 구현만 덜 된 경우”를 먼저 배제한다.
3. 이 파일 자체에는 결정 내용을 늘리지 않는다. 한 줄 요약만 유지한다.
4. 새 ADR이 추가되면 이 표에 한 줄 추가하고, `doc/DOC_INDEX.md`의 adr 섹션에도 반영한다.
