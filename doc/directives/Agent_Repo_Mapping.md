# BRAINPOOL Repository Health & Mapping (v1.2)

본 문서는 저장소별 책임과 연결 상태를 관리합니다.

| Repository | Owner | Status | ADR 연결 | Master Prompt | Automation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `brainpool-os` | 클로1 / 클로4 | Active | [Link] | [Link] | [Link] |
| `brainpool-clean` | 클로5 | Active | [Link] | [Link] | [Link] |
| `corenull` | 클로3 | Active | [Link] | [Link] | [Link] |
| `hajun-ai` | 클로2 | Active | [Link] | [Link] | [Link] |

---

## 데이터 소유권 (Derived Data Ownership)
- **Language Knowledge**: `tb_trans_logs` (Owner: CoreRing)
- **Life Knowledge**: `house_snapshots` (Owner: CoreNull)
- **Operational Data**: `opportunities` (Owner: CoreHub)
- **Mind Context**: `contexts` (Owner: HajunAI)

*원칙: 하나의 데이터는 반드시 하나의 Owner만 가진다.*

<!--
아래는 brainpool-os 저장소의 doc/directives/Agent_Repo_Mapping.md 에 추가할 내용입니다.
corenull 저장소가 아니라 brainpool-os 저장소 문서라 제가 직접 못 고치고, 텍스트만 준비했습니다.
"데이터 소유권" 섹션 바로 아래에 이 섹션을 추가해주세요.
-->

## Identity (Platform-level, 코드 위치만 corenull)

- `link_codes` 테이블과 `/api/identity` 라우트는 **corenull 저장소 안에 물리적으로 위치**하지만,
  개념적으로는 특정 Core 소속이 아니라 **모든 Core가 참조하는 Platform-level Identity**다.
- 2026-07-19, Identity Platform Architecture Decision Log ①항에 따라 `LinkCredential`로 일반화됨
  (`target: invite | recover` 필드로 기존 초대/복구를 같은 메커니즘으로 통합).
- 코드 소유/유지보수는 클로3(코어널)이 담당하되, 스키마/흐름 변경 시 Platform-level 영향 범위(전체 Core)를
  함께 검토해야 한다.
