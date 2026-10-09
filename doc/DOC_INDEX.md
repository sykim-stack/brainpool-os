# BRAINPOOL OS Document Index
_기준일: 2026-10-09_
_PM: Grok_

이 문서는 `doc/` 아래 **현재 유효한 문서**의 지도이다.

## 계층 구조 (읽는 순서)

| Level | 문서 | 역할 |
| :--- | :--- | :--- |
| **0** | `directives/Master_Prompt_v2.0.md` | Constitution (최상위 헌법) |
| **1** | `directives/Identity_Platform_Architecture_v1.0.md` | Identity Platform |
| **1** | `directives/Governance_Foundation_v1.0.md` | 운영 원칙 요약 |
| **1** | `directives/CoreNull_Core_Principles_v1.2.md` | **CoreNull Anchor** |
| **1** | `directives/HajunAI_AI_CoreNull_Philosophy_v1.0.md` | HajunAI = AI판 CoreNull |
| **1** | `directives/HajunAI_Space_Message_Architecture_v1.0.md` | **HajunAI 공간·메시지 아키텍처** |
| **2** | `directives/HajunAI_DevChat_Control_Directive_v1.0.md` | 개발 Chat · 관제=검사관 |
| **2** | `directives/CoreNull_UI_Architecture_MasterView_Block_v1.0.md` | Master View + Block UI |
| **2** | `directives/AI_Collaboration_Governance.md` | AI 협업 SOP |
| **2** | `directives/CoreNull_Mockup_Handoff_v1.0.md` | 클로3↔클로4 목업 매핑 |
| **2** | `automation/WORKFLOW.md` | Commit-Centric 운영 |
| **3** | `directives/Agents_Directive.md` | 에이전트 역할 |
| **3** | `contexts/clo2.md` ~ `pm.md` | Context Contract |
| **3** | `directives/WORK_ORDER_clo3_PhaseA.md` / `WORK_ORDER_clo4_PhaseA.md` | Phase A 지시 |
| **4** | `adr/` | 개별 설계 결정 |
| **Status** | `status/` | 진행 상태 |
| **Baseline** | `status/BRAINPOOL_INTEGRATED_STRUCTURE_INVESTIGATION_v2_2026-09-28.md` | **통합 구조·조사 기준 기록 v2** |
| **History** | `status/BRAINPOOL_CLEAN_LEGACY_CODE_HISTORY_2026-10-02.md` | **brainpool-clean 레거시 코드 진화 역사** |

## 폴더별 유효 문서

### directives/
- `Master_Prompt_v2.0.md` — Constitution
- `CoreNull_Core_Principles_v1.2.md` — CoreNull Anchor
- `HajunAI_AI_CoreNull_Philosophy_v1.0.md` — AI판 CoreNull
- `HajunAI_Space_Message_Architecture_v1.0.md` — **공간·메시지 아키텍처**
- `HajunAI_DevChat_Control_Directive_v1.0.md` — 개발 Chat·관제 검사관
- `CoreNull_UI_Architecture_MasterView_Block_v1.0.md` — Master View + Block
- `CoreNull_Mockup_Handoff_v1.0.md` / `WORK_ORDER_clo3_PhaseA.md` / `WORK_ORDER_clo4_PhaseA.md`
- `AI_Collaboration_Governance.md` / `Agents_Directive.md` / `Agent_Repo_Mapping.md`
- `Identity_Platform_Architecture_v1.0.md`
- `CoreNull_Seed_System.md` — **Deprecated**
- `BRAINPOOL_HajunAI_Manual.md` / `Task_Identity_Connection_v1.0.md` / `Governance_Foundation_v1.0.md` / `Team_Directive_v1.0.md`

### contexts/
- `clo2.md` · `clo3.md` · `clo4.md` · `clo5.md` · `pm.md`

### automation/
- `WORKFLOW.md` / `PM_GUARD.md` / `ARCHITECTURE_LINTER.md` / `IMPACT_RULES.md`

### adr/
- `INDEX.md` — ADR 탐색 인덱스 (새 제안 전 필수 확인)
- `ADR-ACCESS-001.md` — Access Policy
- `ADR-ACCESS-002.md` — Neighbor 성립·골목 범위
- `ADR-NEIGHBOR-000.md` — Neighbor = 관계
- `ADR-CONFIRM-000.md` — adopted ≠ decision
- `ADR-CONTEXT-000.md` — contexts 소유권 (원본=Core, 이해=HajunAI)
- `ADR-HAJUNAI-CHILD-000.md` — **챗봇 아님. 정체성·대화성장·마당↔chat** (2026-09-14)
- `ADR-HERMES-000.md` — **Phase 0 Action Unit 경계. 판단·5후보 제안만. 실행 금지** (2026-10-08)
- `ADR-SEED-ADAPTER-000.md` — Adapter 제거 트리거
- `ADR-RINGBLOCK-000.md` — RingBlock 표현 계약

### status/
- `DEV_CONTEXT_SUMMARY.md` / `CORENULL_ROADMAP.md`
- `CONTEXT_LOOP_2026-09-13.md` — 맥락 본선 검증
- `HAJUNAI_CHILD_DESIGN_2026-09-14.md` — 아이 설계 세션 요약
- `CORERING_STABILIZATION_2026-09-18.md` — **CoreRing 안정화 · HajunAI 연결 보류 의미 정정** (분석→HajunAI만 ⏸️ / 하준챗·방·ADR-CONTEXT-000 🟢)
- `BRAINPOOL_INTEGRATED_STRUCTURE_INVESTIGATION_v2_2026-09-28.md` — **통합 구조·조사 기록 v2 (기준일 2026-09-28)** · 확정/강한근거/미확인 분리 · 설계 확정서 아님
- `BRAINPOOL_CLEAN_LEGACY_CODE_HISTORY_2026-10-02.md` — **brainpool-clean 레거시 코드 진화 역사** · 삭제하지 않음 · 에러도 메시지로 취급
- `HERMES_PHASE0_BOUNDARY_LOCK_2026-10-09.md` — **Hermes Phase 0 경계 잠금 확인** (ADR-HERMES-000 재확인 · 실행 금지 · 5후보 고정)

### root of doc/
- `Identity Platform Architecture — Decision Log.md`

## 폐기·삭제

### Deprecated
- `directives/CoreNull_Seed_System.md` — Anchor v1.2 대체

---
*새 문서를 추가할 때는 이 Index에도 한 줄 추가한다.*
