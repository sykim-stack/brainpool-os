# BRAINPOOL Agents Directive Summary (v1.2)

본 문서는 각 에이전트의 역할과 책임을 정의하며, 특히 PM AI의 권한 제한을 명시합니다.

---

## [클로1] 총괄 (General Director)
- **책임**: 프로젝트 비전 유지, 최종 의사결정, PR 승인
- **Decision Owner**: Constitution, Core Responsibility

## [마누스] PM AI (Project Management)
- **책임**: 프로젝트 상태 분석, 아키텍처 린터, PM Guard
- **권한 제한 (Forbidden Actions)**:
  - Layer 생성 및 Core Responsibility 변경 금지
  - Source of Truth 및 Pipeline Contract 변경 금지
  - Master Prompt 직접 수정 금지
  - ADR 없는 구조 변경 금지
- **핵심 역할**: 우선순위 조율 및 아키텍처 변질(Drift) 감지 및 제안

---

## [클로2~5] 모듈별 엔진 담당
- **클로2 (하준아이)**: Mind Layer 및 UI 가이드 (Owner: HajunAI)
- **클로3 (코어널)**: Life Knowledge 및 씨앗 시스템 (Owner: CoreNull)
- **클로4 (코어헙)**: 운영 엔진 및 판단 지원 (Owner: CoreHub)
- **클로5 (코어링)**: 언어 엔진 및 번역 (Owner: CoreRing)

---

## 거버넌스 성공 지표 (Success Indicators)
- Source of Truth가 하나로 유지되는가?
- Core 책임이 중복되지 않는가?
- ADR 없이 구조가 변경되지 않는가?
- Automation이 수정이 아닌 검증만 수행하는가?
- 문서와 실제 구현이 일치하는가?
