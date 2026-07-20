# BRAINPOOL OS Development Context Summary (2026-07-20)

## 1. 프로젝트 현황 (Current Status)
- **현재 페이즈**: Phase 1 (Governance & Identity Foundation)
- **상태**: Active (신규 거버넌스 체계 가동 중)
- **건강도**: 95/100 (아키텍처 문서화 완료, 실시간 맥락 API 가동)

## 2. 주요 의사결정 기록 (Decision Log)
- **[Level 0] Pipeline Contract**: 모든 엔진은 `ctx`를 매개로 통신하며 `(ctx) => ctx` 계약을 준수함.
- **[Level 1] Identity First Platform**: "로그인 시스템" 개념 폐기. `Identity Platform`은 애플리케이션 독립적인 인프라로 정의됨.
- **[Level 1] One owner_key = One House**: 신원당 하나의 집(House)이 자동 생성되며, 사용자는 방(Room)만 생성 및 관리함.
- **[Level 2] AI Collaboration Governance**: `READ-VERIFY-DESIGN-CODE-REPORT` 표준 절차 도입.
- **[Level 4] CoreNull Strategy**: CoreHub 개발 일시 중단. CoreHub가 분석할 토양인 `CoreNull`의 `house_snapshots` 안정화에 집중함.

## 3. 현재 문제 및 리스크 (Current Problems & Risks)
- **[Data Integrity]**: 한국/베트남 House 중복 생성 현상 발견 (여리 총괄 직접 확인 중).
- **[Context Lag]**: 에이전트 간의 실시간 맥락 동기화 지연 (Context API 도입으로 해결 시도 중).
- **[Architecture Drift]**: 기능 구현 중심의 사고로 인한 Pipeline Contract 위반 위험 상존 (PM Guard 감시 강화).

## 4. 다음 액션 및 우선순위 (Next Actions)
1. **[CoreNull]** House-Room-Message 연결 안정화 및 Snapshot 생성 로직 완성 (최우선).
2. **[Identity]** `link_codes` 테이블에 `target` 필드 추가 및 통합 Credential 시스템 구현 (클로3/5).
3. **[Governance]** GitHub Action을 활용한 자동 아키텍처 린터(Linter) 기반 마련.
4. **[CoreRing]** ADR-SEO-001 승인에 따른 검색 최적화 엔진 구현 (클로5).

## 5. 에이전트별 지침 (Agent Directives)
- **클로1 (총괄)**: PR 승인 시 `ARCHITECTURE_LINTER.md` 준수 여부 엄격 검토.
- **클로2 (하준아이)**: `Identity First` UX (House 자동 생성, Room 중심) 설계 반영.
- **클로3 (코어널)**: `LinkCredential` 통합 및 `house_snapshots` 데이터 무결성 확보.
- **클로4 (코어헙)**: 신규 기능 구현 중단, CoreNull 데이터 수용 인터페이스만 준비.
- **클로5 (코어링)**: `target` 필드 기반 신원 복구 로직 및 SEO 구현.

---
*본 요약은 /api/hajun?action=context_package를 통해 모든 에이전트에게 실시간 주입됩니다.*
