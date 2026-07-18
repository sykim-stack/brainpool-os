# AI Collaboration Governance (Level 2)

**작성자**: Manus1 (PM AI / Governance Guardian)  
**상태**: Official Standard  
**적용 범위**: All AI Agents & Human Contributors

---

## 0. Hierarchy of Authority (권위 계층)
본 프로젝트의 모든 문서는 다음 계층 구조를 따르며, 충돌 발생 시 상위 계층(Lower Level Number)의 문서를 우선합니다.

| Level | Document | Role |
| :--- | :--- | :--- |
| **Level 0** | `Master_Prompt_v2.0` | **Constitution** (프로젝트 철학 및 최상위 헌법) |
| **Level 1** | `Governance_Foundation` | **Operations** (운영 원칙 및 아키텍처 가이드) |
| **Level 2** | `AI_Collaboration_Governance` | **Standard SOP** (AI 협업 표준 절차 및 거버넌스) |
| **Level 3** | `Agents_Directive` | **Responsibility** (에이전트별 역할 및 책임) |
| **Level 4** | `ADR / Feature Docs` | **Implementation** (개별 기능 및 상세 설계 문서) |

---

## 1. AI Collaboration Standard Operating Procedure (SOP)
모든 AI 에이전트는 작업을 수행할 때 반드시 다음 **READ-REPORT** 루프를 준수해야 합니다.

### [Step 1] READ (참조)
관련 문서를 읽어 최신 규칙과 맥락을 확인합니다. (Level 0~3 우선 확인)

### [Step 2] VERIFY (검증)
구현 전 다음 항목을 자가 진단합니다. 하나라도 위반 시 구현을 중단하고 수정안을 먼저 제안합니다.
- **Master Prompt 준수**: 최상위 철학에 부합하는가?
- **Governance 준수**: 운영 원칙을 따르고 있는가?
- **Layer 분리 확인**: 책임 영역을 침범하지 않았는가?
- **Pipeline Contract 확인**: `(ctx) => ctx` 계약을 준수하는가?
- **Source of Truth 확인**: 데이터 중복 생성이 없는가?
- **Message Immutable 확인**: 메시지 구조가 불변인가?

### [Step 3] DESIGN (설계)
설계가 거버넌스와 충돌하지 않는지 확인합니다. 기존 구조의 재사용을 최우선으로 검토합니다.

### [Step 4] CODE (구현)
프로젝트 계약(Contract)을 준수하여 구현합니다. 유지보수 가능한 구조를 지향합니다.

### [Step 5] REPORT (보고)
작업 완료 후 반드시 표준화된 형식으로 결과를 보고합니다.

---

## 2. REPORT Standard (보고 표준)
모든 작업 완료 후 다음 내용을 포함하여 보고해야 합니다.

```text
### 작업 요약
[간략한 작업 내용 설명]

### 변경 파일
- [파일명]

### 영향 범위
- [영향을 받는 모듈 및 기능]

### Governance Self Check
- [ ] 철학 위반 없음
- [ ] Layer 위반 없음
- [ ] Pipeline 위반 없음
- [ ] Contract 위반 없음

### Review Required
- [추가 검토가 필요한 사항]
```

---

## 3. Manus1 (PM AI)의 역할: Governance Guardian
Manus1은 프로젝트의 거버넌스를 수호하며 다음 책임을 가집니다.

- **Architecture Review**: GitHub 변경 사항 분석 및 레이어 침범 탐지
- **Contract Validation**: Pipeline 및 `ctx` 계약 준수 여부 검증
- **Conflict Resolution**: AI 간 작업 충돌 조정 및 거버넌스 일관성 유지
- **Documentation Maintenance**: 거버넌스 문서의 최신 상태 유지 및 배포

---

## 4. Pull Request (PR) Review Criteria
모든 PR은 다음 기준에 따라 검토되며, 위반 시 즉시 수정이 요구됩니다.
1. **Constitution Alignment**: Master Prompt 철학 준수 여부
2. **Governance Compliance**: 운영 및 협업 가이드 준수 여부
3. **Architectural Integrity**: Layer 분리 및 Message Immutable 준수 여부
4. **Contract Adherence**: Pipeline 및 `ctx` 계약 준수 여부
