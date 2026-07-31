# BRAINPOOL OS Document Index
_기준일: 2026-08-01_
_PM: Grok_

이 문서는 `doc/` 아래 **현재 유효한 문서**의 지도이다.
구버전·빈 파일·중복 파일은 2026-08-01 cleanup에서 제거했다.

## 계층 구조 (읽는 순서)

| Level | 문서 | 역할 |
| :--- | :--- | :--- |
| **0** | `directives/Master_Prompt_v2.0.md` | Constitution (최상위 헌법) |
| **1** | `directives/Identity_Platform_Architecture_v1.0.md` | Identity Platform |
| **1** | `directives/Governance_Foundation_v1.0.md` | 운영 원칙 요약 |
| **2** | `directives/AI_Collaboration_Governance.md` | AI 협업 SOP |
| **2** | `automation/WORKFLOW.md` | Commit-Centric 운영 모델 |
| **3** | `directives/Agents_Directive.md` | 에이전트 역할·권한 |
| **3** | `contexts/clo2.md` / `clo3.md` | 에이전트 Context Contract |
| **4** | `adr/` | 개별 설계 결정 |
| **Status** | `status/DEV_CONTEXT_SUMMARY.md` | 현재 진행 상태 |
| **Status** | `status/CORENULL_ROADMAP.md` | CoreNull Phase A 실행 로드맵 |

## 폴더별 유효 문서

### directives/
- `Master_Prompt_v2.0.md` — Constitution (Active)
- `AI_Collaboration_Governance.md` — AI SOP
- `Agents_Directive.md` — 역할·PM 권한 제한
- `Agent_Repo_Mapping.md` — 레포·데이터 소유권
- `Identity_Platform_Architecture_v1.0.md` — Identity
- `CoreNull_Seed_System.md` — Seed/Fruit 세계관
- `BRAINPOOL_HajunAI_Manual.md` — HajunAI 사용 가이드
- `Task_Identity_Connection_v1.0.md` — LinkCredential 작업지시 (이력)
- `Governance_Foundation_v1.0.md` — Level 1 요약
- `Team_Directive_v1.0.md` — 팀 철학 (참고)

### contexts/
- `clo2.md` — HajunAI (승인 완료)
- `clo3.md` — CoreNull

### automation/
- `WORKFLOW.md` — Commit = 상태 변화 이벤트 운영 모델
- `PM_GUARD.md` — PM 역할·금지 행위
- `ARCHITECTURE_LINTER.md` — 린터 규칙
- `IMPACT_RULES.md` — 영향도 규칙

### adr/
- `ADR-ACCESS-001.md`

### status/
- `DEV_CONTEXT_SUMMARY.md` — **가장 자주 보는 문서**
- `CORENULL_ROADMAP.md` — CoreNull Phase A 실행 순서

### root of doc/
- `Identity Platform Architecture — Decision Log.md` — Identity 결정 로그

## 삭제된 문서 (2026-08-01)
- `API.md`, `영주-코어라이프 빌리지*`, `Identity Platform Architecture — Decision Log.nd`
- `BRAINPOOL-OS-통합-마스터-문서.md`, `ARCHITECTURE.md`, `CHANGELOG.md`
- `directives/Identity_Ownership_Architecture_v3.0.md`

---
*새 문서를 추가할 때는 이 Index에도 한 줄 추가한다.*
