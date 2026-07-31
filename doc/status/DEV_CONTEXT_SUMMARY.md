# BRAINPOOL OS Development Context Summary
_기준일: 2026-08-01_
_PM: Grok (Manus 대체)_

## 1. 프로젝트 현황 (Current Status)
- **현재 페이즈**: Phase 1 (Governance & Identity Foundation) → 실행 안정화 단계
- **상태**: Active
- **건강도**: 88/100 (거버넌스·철학 탄탄, 실행/문서 동기화 및 클로 소진 이슈 존재)

## 2. 주요 의사결정 기록 (Decision Log)
- **[Level 0] Pipeline Contract**: 모든 엔진은 `ctx`를 매개로 통신하며 `(ctx) => ctx` 계약을 준수함.
- **[Level 1] Identity First Platform**: "로그인 시스템" 개념 폐기. `Identity Platform`은 애플리케이션 독립적인 인프라로 정의됨.
- **[Level 1] One owner_key = One House**: 신원당 하나의 집(House)이 자동 생성되며, 사용자는 방(Room)만 생성 및 관리함.
  - **상태: 해결 완료** (2026-07-21 `brainpool-corenull` 커밋 "하우스 방한개" 기준). 문서 미반영이었던 부분 본 요약에서 확정.
- **[Level 2] AI Collaboration Governance**: `READ-VERIFY-DESIGN-CODE-REPORT` 표준 절차 도입.
- **[Level 2] Commit-Centric Collaboration**: Git Commit을 "상태 변화 이벤트"로 관리. PM이 분석 → 문서 반영 → 다음 Agent가 Commit History로 맥락 파악.
- **[Level 4] CoreNull Strategy**: CoreHub 개발 일시 중단. CoreNull의 `house_snapshots` 및 Space 안정화에 집중.

## 3. 현재 문제 및 리스크 (Current Problems & Risks)
- **[운영 병목]**: 클로 하나가 작업을 수행하면 거의 하루를 쉬어야 하는 소진 패턴. 문서화와 상태 동기화가 밀리는 주요 원인.
- **[문서-실행 괴리]**: 해결된 사항(1인 1집 등)이 문서에 즉시 반영되지 않던 문제 → 본 업데이트로 해소 시작.
- **[Context Lag]**: 에이전트 간 실시간 맥락 동기화는 여전히 개선 여지 있음.
- **[Architecture Drift]**: 기능 구현 중심 사고로 인한 Pipeline Contract 위반 위험 상존 (PM Guard 감시 강화).

## 4. 다음 액션 및 우선순위 (Next Actions)
1. **[운영]** Commit → PM 분석 → 문서 반영 루프를 안정적으로 돌리기 (클로 소진 완화).
2. **[CoreNull]** House-Room-Message 연결 및 Snapshot 품질 지속 검증.
3. **[Identity]** `link_codes` target 필드 및 Credential 통합 상태 점검.
4. **[Governance]** 아키텍처 린터 자동화 기반 마련.
5. **[문서]** clo3.md 승인 상태 및 기타 밀린 Context Contract 정리.

## 5. 에이전트별 지침 (Agent Directives)
- **클로1 (총괄)**: PR 승인 시 Architecture Linter 준수 여부 엄격 검토.
- **클로2 (하준아이)**: Knowledge Orchestrator. Messages 직접 접근 최소화 (ADR-001).
- **클로3 (코어널)**: Space Layer. 1인 1집 원칙 유지, house_snapshots 품질 책임.
- **클로4 (코어헙)**: 신규 기능 구현 중단 유지.
- **클로5 (코어링)**: 언어/번역 엔진 + SEO.
- **PM (Grok)**: Context Guardian + Drift Detection + Knowledge Synchronization. Commit을 상태 변화 이벤트로 관리하고 문서를 최신으로 유지.

## 6. 운영 모델 (요약)
```
AI Agent 작업
    ↓
Git Commit          ← 상태 변화 이벤트
    ↓
PM 분석 (영향 / Drift / Context)
    ↓
문서 반영 (푸시)
    ↓
다음 Agent가 Commit History로 맥락 파악
```
목표는 AI가 대화를 기억하는 것이 아니라, **시스템이 상태를 기억하도록** 만드는 것이다.

---
*본 요약은 PM이 Commit 기준으로 갱신한다. /api/hajun?action=context_package와 동기화 권장.*
