# 작업 지시서 — 클로3 (CoreNull 구현) Phase A

**수신**: 클로3  
**작성**: Grok (PM)  
**날짜**: 2026-08-06  
**선행 문서 (세션 주입 필수)**:

1. `CoreNull_Core_Principles_v1.2.md`
2. `CoreNull_Mockup_Handoff_v1.0.md`
3. `CORENULL_ROADMAP.md`
4. `contexts/clo3.md`

레포: `sykim-stack/brainpool-corenull`

---

## 목표

클로4 목업 HTML을 **기존 소스에 매핑**하여 Phase A Experience를 구현한다.  
새 테이블·상태 머신·카드 난립 금지.

---

## 구현 순서 (로드맵 §6과 동일)

```
1. Room Card (공통 + 씨드 배지 뷰 계산)
2. 거실   — app/me/page.tsx, houses/[houseId]
3. 광장   — public Room Card 리스트 (app/page.tsx 등)
4. 마당   — app/yard/page.tsx (집주인 파트)
5. 서재   — app/me/library/page.tsx (harvested View)
```

매핑표: `CoreNull_Mockup_Handoff_v1.0.md` §3

---

## 매핑 방법

1. 목업의 `data-scope` / `data-primitive` / `data-seed-badge` 를 읽는다.
2. §3 표에서 **기존 파일**을 고른다.
3. 스타일·배치만 목업에 맞추고, 데이터는 Room/Message API 유지.
4. 배지:

```
progress = (now - seed_started_at) / (seed_target_date - seed_started_at)
→ 🌱🌿🌸🍎 (저장 안 함)
seed_target_date == null → 🌿 고정
```

현재 스키마에 `seed_mode` / `bloom_date`가 남아 있으면 **읽기 호환**만 하고,  
신규 쓰기는 Anchor 스위치 모델 방향으로 (마이그레이션 전체는 별도 지시).

---

## 받기 직후 체크리스트

```
□ 기존 라우트/컴포넌트에 붙였는가?
□ 새 테이블/컬럼 없이 가능한가?
□ Room Card 재사용인가?
□ 스위치 UI는 Owner only인가?
□ 카피/변수에 시작·전환·종료·단계·개수 없는가?
```

---

## 하지 말 것

- 참여자별 Room/Message 복제
- 광장/마당/거실 전용 테이블
- 진행률(%) DB 컬럼
- 목업과 다른 시각 언어로 전면 재디자인
- CoreRing/HajunAI/CoreHub 내부 수정

---

## 완료 조건 (1차)

- [ ] Room Card + 배지가 거실 또는 마당 중 한 Scope에 실제 동작
- [ ] 목업 data-* 의와 UI 대응이 문서와 일치
- [ ] Anchor 위반 없음 (PR 설명에 Handoff 체크 결과 한 줄)

---

## 막힐 때

새 Primitive가 필요하다고 느끼면 구현 전에 함장/PM에 한 줄.  
대부분은 View 필터 또는 Room 스위치로 끝난다.

_PM: Grok_
