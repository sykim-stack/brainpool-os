# BRAINPOOL OS Document Index
_기준일: 2026-08-20_
_PM: Grok_

이 문서는 `doc/` 아래 **현재 유효한 문서**의 지도이다.

## 계층 구조 (읽는 순서)

| Level | 문서 | 역할 |
| :--- | :--- | :--- |
| **0** | `directives/Master_Prompt_v2.0.md` | Constitution (최상위 헌법) |
| **1** | `directives/Identity_Platform_Architecture_v1.0.md` | Identity Platform |
| **1** | `directives/Governance_Foundation_v1.0.md` | 운영 원칙 요약 |
| **1** | `directives/CoreNull_Core_Principles_v1.2.md` | **CoreNull Anchor** (설계 최상위 기준) |
| **1** | `directives/HajunAI_AI_CoreNull_Philosophy_v1.0.md` | **HajunAI = AI판 CoreNull** |
| **2** | `directives/HajunAI_DevChat_Control_Directive_v1.0.md` | 개발 Chat · 관제=검사관 |
| **2** | `directives/CoreNull_UI_Architecture_MasterView_Block_v1.0.md` | Master View + Block UI |
| **2** | `directives/AI_Collaboration_Governance.md` | AI 협업 SOP |
| **2** | `directives/CoreNull_Mockup_Handoff_v1.0.md` | 클로3↔클로4 목업 매핑 |
| **2** | `automation/WORKFLOW.md` | Commit-Centric 운영 모델 |
| **3** | `directives/Agents_Directive.md` | 에이전트 역할·권한 |
| **3** | `contexts/clo2.md` / `clo3.md` / `clo4.md` / `clo5.md` / `pm.md` | Context Contract |
| **3** | `directives/WORK_ORDER_clo3_PhaseA.md` | 클로3 Phase A |
| **3** | `directives/WORK_ORDER_clo4_PhaseA.md` | 클로4 Phase A |
| **4** | `adr/` | 개별 설계 결정 |
| **Status** | `status/DEV_CONTEXT_SUMMARY.md` | 현재 진행 상태 |
| **Status** | `status/CORENULL_ROADMAP.md` | CoreNull Phase A 로드맵 |

## 폴더별 유효 문서

### directives/
- `Master_Prompt_v2.0.md` — Constitution (Active)
- `CoreNull_Core_Principles_v1.2.md` — **CoreNull Anchor** (Active, 2026-08-02)
- `HajunAI_AI_CoreNull_Philosophy_v1.0.md` — AI판 CoreNull (Active, 2026-08-19/20)
- `HajunAI_DevChat_Control_Directive_v1.0.md` — 개발 Chat·관제 검사관 (Active, 2026-08-17)
- `CoreNull_UI_Architecture_MasterView_Block_v1.0.md` — Master View + Block (Active, 2026-08-20)
- `CoreNull_Mockup_Handoff_v1.0.md` — 클로3/클로4 목업→소스 매핑
- `WORK_ORDER_clo3_PhaseA.md` / `WORK_ORDER_clo4_PhaseA.md`
- `AI_Collaboration_Governance.md` — AI SOP
- `Agents_Directive.md` — 역할·PM 권한 제한
- `Agent_Repo_Mapping.md` — 레포·데이터 소유권
- `Identity_Platform_Architecture_v1.0.md` — Identity
- `CoreNull_Seed_System.md` — **Deprecated** (→ Anchor v1.2)
- `BRAINPOOL_HajunAI_Manual.md` — HajunAI 사용 가이드
- `Task_Identity_Connection_v1.0.md` — LinkCredential (이력)
- `Governance_Foundation_v1.0.md` — Level 1 요약
- `Team_Directive_v1.0.md` — 팀 철학 (참고)

### contexts/
- `clo2.md` — HajunAI
- `clo3.md` — CoreNull 구현
- `clo4.md` — CoreNull 디자인 & CoreHub 매핑
- `clo5.md` — CoreRing
- `pm.md` — Grok PM

### automation/
- `WORKFLOW.md` / `PM_GUARD.md` / `ARCHITECTURE_LINTER.md` / `IMPACT_RULES.md`

### adr/
- `ADR-ACCESS-001.md` — Access Policy
- `ADR-NEIGHBOR-000.md` — Neighbor = 관계 (권한 아님), ACCESS-002 선행
- `ADR-SEED-ADAPTER-000.md` — Seed Adapter 제거 **트리거 조건** (날짜 아님; 클로1 승인 후 마이그레이션)

### status/
- `DEV_CONTEXT_SUMMARY.md`
- `CORENULL_ROADMAP.md` — Phase A (A-2 마당 명칭 정리 반영)

### root of doc/
- `Identity Platform Architecture — Decision Log.md`

## 폐기·삭제

### Deprecated (파일 유지, 인용 금지)
- `directives/CoreNull_Seed_System.md` — 2026-08-02, Anchor v1.2로 대체

### 삭제된 문서 (2026-08-01)
- `API.md`, `영주-코어라이프 빌리지*`, `Identity Platform Architecture — Decision Log.nd`
- `BRAINPOOL-OS-통합-마스터-문서.md`, `ARCHITECTURE.md`, `CHANGELOG.md`
- `directives/Identity_Ownership_Architecture_v3.0.md`

---
*새 문서를 추가할 때는 이 Index에도 한 줄 추가한다.*
