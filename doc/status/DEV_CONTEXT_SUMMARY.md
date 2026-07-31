# BRAINPOOL OS Development Context Summary
_기준일: 2026-08-01_
_PM: Grok (Manus 대체)_

## 1. 프로젝트 현황 (Current Status)
- **현재 페이즈**: CoreNull Phase A 실행 (View Scope 기반 Experience 구현)
- **상태**: Active
- **건강도**: 88/100 (거버넌스·철학 탄탄, Phase A 실행이 병목 해소 열쇠)

## 2. 주요 의사결정 기록 (Decision Log)
- **[Level 0] Pipeline Contract**: 모든 엔진은 `ctx`를 매개로 통신하며 `(ctx) => ctx` 계약을 준수함.
- **[Level 1] Identity First Platform**: "로그인 시스템" 개념 폐기. Identity Platform은 애플리케이션 독립 인프라.
- **[Level 1] One owner_key = One House**: **해결 완료** (2026-07-21).
- **[Level 2] AI Collaboration Governance**: READ-VERIFY-DESIGN-CODE-REPORT + Commit-Centric 운영.
- **[Level 4] CoreNull Strategy**: CoreHub pause. CoreNull은 껍데기(글-이미지-댓글). Seed/Flower/Fruit = Room 상태.
- **[Level 4] View Scope Architecture**: Primitive → View Scope(CoreNull) → Experience. Presentation 재정렬은 CoreHub.

## 3. 현재 문제 및 리스크
- **[실행 병목]**: CoreNull Phase A (Room Card → 거실 → 광장 → 마당 → 서재) 미완이 전체 진행을 막고 있음.
- **[운영 병목]**: 클로 소진 → 문서/상태 동기화 지연. Commit-Centric PM 루프로 완화 중.
- **[문서-실행 괴리]**: 2026-08-01 cleanup으로 상당 부분 해소. Master_Prompt PM 표기는 클로1 수정 대기.

## 4. 다음 액션 및 우선순위 (CoreNull Phase A)

상세: `doc/status/CORENULL_ROADMAP.md`

```
1. Room Card 컴포넌트 (A-1)
2. 거실 (A-3) — 의존성 없음, 최우선
3. 광장 (A-2)
4. 마당 집주인 파트 (A-4)
5. 서재 (A-5)
```

**재작업 금지 (이미 완료)**: ADR-ACCESS-001, LinkCredential, 1인1집, CoreRing SEO

**Phase B 대기**: 마당 이웃 섹션 (ADR-ACCESS-002), CoreHub Presentation, 나이테

## 5. 에이전트별 지침
- **클로1**: Master_Prompt PM 표기(마누스→Grok) 수정, PR 승인
- **클로2**: Knowledge Orchestrator. Messages 직접 접근 최소화
- **클로3**: **Phase A 실행** (위 순서). 새 Primitive 만들지 말 것
- **클로4**: pause 유지
- **클로5**: SEO 등 언어 영역 별도 진행
- **PM (Grok)**: Context Guardian. Commit 분석 → 문서 반영

## 6. 운영 모델
```
AI Agent 작업 → Git Commit → PM 분석 → 문서 반영 → 다음 Agent가 History로 맥락 파악
```
목표가 AI가 대화를 기억하는 것이 아니라, **시스템이 상태를 기억하도록** 만드는 것.

---
*문서 지도: `doc/DOC_INDEX.md`*
*CoreNull 로드맵: `doc/status/CORENULL_ROADMAP.md`*
