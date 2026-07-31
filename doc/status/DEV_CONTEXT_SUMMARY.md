# BRAINPOOL OS Development Context Summary
_기준일: 2026-08-01_
_PM: Grok (Manus 대체)_

## 1. 프로젝트 현황 (Current Status)
- **현재 페이즈**: CoreNull Phase A 실행 (View Scope 기반 Experience 구현)
- **상태**: Active
- **건강도**: 88/100

## 2. 주요 의사결정 기록 (Decision Log)
- **[Level 0] Pipeline Contract**: `(ctx) => ctx` 계약 준수.
- **[Level 1] One owner_key = One House**: **해결 완료**.
- **[Level 2] Commit-Centric Collaboration**: Commit = 상태 변화 이벤트.
- **[Level 4] CoreNull Primitive 확정**:
  ```
  House → Room → Post
  Seed / Flower / Fruit = Room 상태값 (별도 테이블 아님)
  seed_mode: true = 씨앗 상태 Room
  ```
- **[Level 4] Phase A 순서 확정**: Room Card → 거실 → 광장 → 마당(집주인) → 서재

## 3. 현재 문제 및 리스크
- **[실행 병목]**: CoreNull Phase A 미완
- **[Knowledge 정렬]**: `house_snapshots.content.rooms`의 `seed_mode`를
  Room 상태로 재해석하도록 clo2 `sync_snapshot` 정렬 필요
- **[운영 병목]**: 클로 소진 → Commit-Centric PM 루프로 완화 중
- **[문서]**: Master_Prompt PM 표기(마누스)는 클로1 수정 대기

## 4. 다음 액션 및 우선순위

### CoreNull (클로3) — Phase A
상세: `doc/status/CORENULL_ROADMAP.md`
```
1. Room Card (A-1)
2. 거실 (A-3)
3. 광장 (A-2)
4. 마당 집주인 (A-4)
5. 서재 (A-5)
```

### HajunAI (클로2)
- Knowledge Unit 생성 시 Primitive 기준 반영
  (`seed_mode` → Room 상태 재해석)
- Context Contract: `/api/docs?file=clo2`

### 재작업 금지
ADR-ACCESS-001, LinkCredential, 1인1집, CoreRing SEO

### Phase B 대기
마당 이웃 (ADR-ACCESS-002), CoreHub Presentation, 나이테

## 5. 에이전트별 지침
- **클로1**: Master_Prompt PM 표기 수정
- **클로2**: Knowledge 정렬 + Mind Layer. Messages 직접 접근 최소화
- **클로3**: Phase A 실행. 새 Primitive 금지
- **클로4**: pause
- **클로5**: SEO 등 언어 영역
- **PM (Grok)**: Context Guardian. Commit → 문서 반영

## 6. 맥락 진입점
- 클로2 Contract: `/api/docs?file=clo2` 또는 `doc/contexts/clo2.md`
- 클로3 Contract: `/api/docs?file=clo3` 또는 `doc/contexts/clo3.md`
- CoreNull 로드맵: `doc/status/CORENULL_ROADMAP.md`
- 문서 지도: `doc/DOC_INDEX.md`

---
*시스템이 상태를 기억한다. Commit이 맥락이다.*
