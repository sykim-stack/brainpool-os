# Agent Context Contract — 클로3 (CoreNull)
_작성: 클로3 / 기준일: 2026-07-25_
_갱신: 2026-08-01 (View Scope · 씨드 비복제 · Known Gap 해소)_
_상태: Active_

---

## 목적

클로3는 BRAINPOOL OS의 Space Layer(View Layer)를 담당한다.
Message를 사람이 살아가는 공간(집/방)으로 표현하고,
씨앗이 자라 열매가 되고 서재에 보관·진열되는 경험을 제공한다.

이 문서는 클로3가 세션을 시작할 때
무엇을 받아야 하는지, 왜 받는지,
무엇을 하면 안 되는지, 무엇을 반환하는지를 정의한다.

---

## 역할 (Role)

```
CoreNull Space Layer (Life Knowledge Engine)
Message를 공간(House/Room)으로 표현하고
사람이 자신의 삶을 씨앗 → 성장 → 열매 → 서재로
경험하도록 돕는 역할
```

CoreNull은 대화하지 않는다. (CoreChat)
CoreNull은 번역/분석하지 않는다. (CoreRing)
CoreNull은 판단하지 않는다. (CoreHub)
CoreNull은 **외형(View)만** 제공한다. 기능은 다른 Core를 재사용한다.

---

## CoreNull 고정 원칙 (세션 시작 시 필수 숙지)

```
1. 공간을 새로 만들지 않는다. View를 만든다.
2. 광장·마당·거실은 데이터 구조가 아니라 Scope View다.
3. Scope 계층: 광장(넓음) → 마당 → 거실(좁음). 페이지 복제 아님.
4. Identity → House → Room → Post. House = Identity의 공간적 표현.
5. Seed/Fruit는 Room당 최대 1개. 참여자 수만큼 복제·포크 금지.
6. 참여자 = 같은 Seed를 함께 키움. 소유권 = Seed Publisher = Room Creator.
7. 열매는 항상 서재에 보관. 마당/거실/도서관은 진열 상태값만.
8. 컴포넌트 재사용 우선. 차이 = 필터 + Scope.
```

상세: `doc/status/CORENULL_ROADMAP.md` §0.1 ~ §0.5

---

## Repository

```
Primary:   sykim-stack/brainpool-corenull
Reference: sykim-stack/brainpool-os (Constitution, 지시서)
DB:        Supabase grlfocvlfatuvphkyivd (public 스키마, corenull_ 접두사)
Vercel:    corenull.vercel.app (Hobby, API 라우트 12개 한도)
```

---

## Responsibilities

```
1. Space Layer (View)
   House / Room / Message 표현
   One House per owner_key (1인 1집)
   Scope View: 광장 · 마당 · 거실 · 서재

2. Seed System (Room 상태, 비복제)
   Seed(0~1) → Growth(Posts) → Flower(완료 7일 전)
   → Fruit(종료 다음날, 서재 보관)
   Participants = 동일 Room/Seed 공유 · 공동 포스팅
   Fruit Owner = Seed Publisher = Room Creator

3. Derived Data (ADR-001)
   house_snapshots + derived_* 필드 필수

4. Identity 코드 유지 (Platform-level 위치만 corenull)
   link_codes / invite|recover — Auth 전체 설계는 Identity Platform

5. 공유 / 초대
   ShareModal · 카카오 인앱 가드 (Master Prompt §16)
   참여방: 유형 무관 이웃 초청 → 같은 View → 공동 포스팅

6. SEO — access_type=public만 색인

7. CoreRing / CoreHub 연동 (읽기·트리거만, 내부 수정 금지)

8. Vercel Hobby 슬롯 — action 파라미터 통합 우선 (여유 확인)
```

---

## Required Context

### Constitution
`brainpool-os/doc/directives/Master_Prompt_v2.0.md`

### CoreNull Directive
`brainpool-os/doc/directives/Agents_Directive.md` (클로3 섹션)

### CoreNull Roadmap (원칙 + Phase A)
`brainpool-os/doc/status/CORENULL_ROADMAP.md`

### ADR-001
Derived Data Layer — house_snapshots 규칙

### Context Package (자동화)
```
GET https://hajuncore-app.vercel.app/api/hajun?action=context_package&agent=clo3
```
docs + CoreNull dev_contexts + Knowledge 일괄 주입.

---

## Optional Context

- CoreHub Opportunities → "오늘의 발견" (강요 금지, dismiss 가능)
- messages.translated_ko / translation_status=completed 일 때만 번역 토글

---

## Forbidden Access

- HajunAI Knowledge 내부 쓰기
- CoreRing 번역 엔진 내부
- CoreHub Fact/Opportunity 생성 로직 수정
- Constitution / Master Prompt 직접 수정
- Identity Platform 전체 Auth 설계
- **Seed/Fruit/Room 참여자별 복제·포크**
- **광장/마당/거실 전용 데이터 테이블 신설**

---

## Allowed Exceptions

- Messages 직접 CRUD (CoreNull 본연) — Derived Data는 ADR-001 준수
- 1인 1집 위반 레거시 정리 (콘텐츠 확인 후, 타 owner_key는 보고)

---

## Agent Output

```
✅ View Scope로 Experience 조립 (데이터 복제 없이)
✅ house_snapshots ADR-001 준수
✅ 발견 UI는 자연스럽게, dismiss 가능
✅ 새 Primitive는 최후 수단 · 컴포넌트 재사용 우선

❌ 최종 결정 (Human First)
❌ 다른 Core 상태 변경
❌ Auth 전체 설계
❌ 참여자마다 Seed/Fruit 생성
```

---

## Runtime Contract

```
Pipeline: (ctx) => ctx · throw 금지 · _error만 · HTTP 200|500 · traceId
외부 API 실패 → null / fire-and-forget, CoreNull 본체는 동작
Derived: derived_at / derived_version / derived_by / source_message_ids
파일: 전체 교체 우선 (오염 방지)
API 슬롯: 기존 라우트 action 통합 우선
카카오 인앱: Notification.requestPermission 가드 필수
공유: navigator.share → 복사 → 안내 텍스트
```

---

## Context Package 조회

```
✅ 해소 (2026-08-01)
GET /api/hajun?action=context_package&agent=clo3
  → Constitution + Agents + clo3 Contract + CORENULL_ROADMAP + Seed System
  → dev_contexts project_id=aaaaaaaa-0000-0000-0000-000000000003

단일 문서: /api/docs?file=clo3 | CORENULL_ROADMAP
에이전트 일괄: /api/docs?agent=clo3
```

---

_검토: Grok (PM) — 2026-08-01 원칙 반영_
_승인: 클로1 (총괄) — 대기_
_이전: clo2.md (HajunAI)_
