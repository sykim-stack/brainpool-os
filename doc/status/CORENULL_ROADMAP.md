# CoreNull 실행 로드맵
_기준일: 2026-07-31_
_수신: 클로3 (코어널)_
_상태: Active — Phase A 실행 중_

목적: 철학·설계 논의를 걷어내고, **지금 당장 실행 가능한 순서**만 정리. CoreNull 진행 지체를 끊기 위한 문서.

---

## 0. 한 문장 원칙 (모든 판단 기준)

> CoreNull은 껍데기다. 글-이미지-댓글, 이것만 존재한다.

새 요청이 오면 항상 이 순서로 판단한다:

1. 새 Primitive 필요? → 아니면
2. 기존 Primitive의 View Scope? → 그것도 아니면
3. CoreHub / CoreRing / HajunAI 영역 (CoreNull이 할 일 아님)

## 0.5 Core 경계

| Core | 역할 | 하지 않는 것 |
| :--- | :--- | :--- |
| **CoreNull** | 공간(Space) 제공 | 추천/판단/우선순위/의미분석 안 함 |
| **CoreHub** | 판단(Decision) | 공간 안 만듦. 현재 pause |
| **HajunAI** | 사고(Mind) | 공간 안 만듦. 현재 v5 보류 |
| **CoreRing** | 언어(Language) | Identity 자체 발급 안 함, CoreNull 걸 씀 |

## 1. 확정된 Primitive 구조 (변경 없음)

```
House (Identity가 CoreNull에서 표현되는 형태, 1인 1개, 자동생성)
  ↓
Room (이야기가 사는 공간. Seed/Flower/Fruit는 Room의 상태일 뿐, 별도 객체 아님)
  ↓
Post (Room 안에서만 의미 있음)
```

## 2. View Scope Architecture (CoreNull 전용 원칙)

```
Primitive → View Scope (CoreNull 책임: 무엇을 보여줄지) → Experience
                              ↓ (선택)
                     Presentation 재정렬 = CoreHub 책임, pause 중엔 미적용
```

## 3. Experience + View Scope

| Experience | 정의 | View Scope | 지금 구현 가능? |
| :--- | :--- | :--- | :--- |
| **광장** | 관계 없는 모든 방 발견 | visibility=public 전체 (House 무관) | ✅ |
| **거실** | 내 삶의 흐름 (내가 관리) | 내 House의 Room 목록 + 최근 글 | ✅ |
| **마당 (집주인)** | 이 House의 공개 콘텐츠 소개 | 이 House의 public Room/Seed/Fruit | ✅ |
| **마당 (이웃)** | 이웃 공개방/관계 노출 | House↔House Neighbor 관계 | ❌ ADR-ACCESS-002 대기 |
| **서재** | 축적/보관 (Fruit, Archive) | Post + Member 필터 뷰 | ✅ (구조 확정, UI만 없음) |

## 4. Phase A — 지금 당장 실행 (순서대로)

재사용 컴포넌트(Room Card, Feed, Post Form)를 먼저 만들고 나머지가 조합한다.

### A-1. Room Card 컴포넌트 (공통)
- 표시: Room 이름, 최근 활동(최신 글 요약), 참여자 수, 최근 활동 시각
- Room 소개가 아니라 **최근 활동**을 보여준다
- 클릭 → Room 진입

### A-2. 광장 (Plaza)
- View Scope: visibility = public Room 전체, House 무관
- Room Card 리스트 (A-1 재사용)
- 카드 클릭 시 → 그 Room이 속한 House의 **마당**으로 진입 (Room 직접 진입 아님)

### A-3. 거실 (Living Room)
- View Scope: 내 House의 Room 전체 (visibility 무관)
- 섹션: 내 방 목록 + 최신 글
- 다른 사람 콘텐츠 끌어오지 않음

### A-4. 마당 — 집주인 파트만
- View Scope: 이 House의 public Room/Seed/Fruit
- 이웃 섹션은 이번 라운드에 만들지 않음 (자리만 비우거나 숨김)
- 광장 → 마당 진입 흐름 연결

### A-5. 서재 (Library)
- Post + Member 필터링 View, 복제 없음
- Fruit 수확 이후 항목만 표시
- 새 저장소 없음, 쿼리만

## 5. Phase B — 지금 만들지 않는 것

1. 마당 — 이웃 섹션: ADR-ACCESS-002 (`corenull_neighbors`) 구현 후
2. Presentation 재정렬 (인기순, 추천 등): CoreHub pause 해제 후
3. 나이테 (Hero Ring): 클로4 컨셉 확정 대기

## 6. 이미 완료된 것 (재작업 금지)

- ADR-ACCESS-001 Phase 1 (family 방 읽기 권한, post_id 우회 차단) — 배포·검증 완료
- LinkCredential (invite/recover 통합) — 완료
- House 1인1집 + 홈=Room목록 재구성 — 완료
- CoreRing SEO (ADR-SEO-001) — 완료 (CoreNull과 무관, 별도 진행)

## 7. 실행 순서 요약

```
1. Room Card 컴포넌트 (A-1)
2. 거실 (A-3) — 의존성 없음, 가장 먼저 완성 가능
3. 광장 (A-2) — Room Card 재사용
4. 마당, 집주인 파트만 (A-4) — 광장→마당 라우팅 연결
5. 서재 (A-5) — 기존 쿼리 구조라 병렬 진행 가능
```

Phase A 다섯 개가 끝나면 CoreNull Phase 0 (House/Yard/Library 완성)이 사실상 종료된다. 그 이후 Phase B 재검토.
