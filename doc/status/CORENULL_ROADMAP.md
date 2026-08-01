# CoreNull 실행 로드맵
_기준일: 2026-07-31 / 갱신: 2026-08-01 (설계 원칙 고정)_
_수신: 클로3 (코어널)_
_상태: Active — Phase A 실행 중_

목적: 철학·설계 논의를 걷어내고, **지금 당장 실행 가능한 순서**만 정리. 설계 원칙은 문서 상단에 고정한다.

---

## 0. 한 문장 원칙 (모든 판단 기준)

> CoreNull은 껍데기다. 글-이미지-댓글, 이것만 존재한다.

새 요청이 오면 항상 이 순서로 판단한다:

1. 새 Primitive 필요? → 아니면
2. 기존 Primitive의 View Scope? → 그것도 아니면
3. CoreHub / CoreRing / HajunAI 영역 (CoreNull이 할 일 아님)

---

## 0.1 CoreNull 고정 원칙 (Architecture Guard — 최우선)

### Rule A — 공간(데이터)을 만들지 않는다. View를 만든다.

광장 / 마당 / 거실 / 서재 / 도서관은 **새 테이블·새 Primitive가 아니다.**  
동일한 `House → Room → Post`를 **Scope·진열 상태**만 바꿔 보여주는 View다.

### Rule B — 복제·포크 금지

씨드·열매·방을 참여자 수만큼 복사하지 않는다.  
DB에는 **하나의 Room / 하나의 Seed / 하나의 Fruit**만 존재한다.  
각 집에 보이는 것은 복제본이 아니라 **같은 대상을 바라보는 View**다.

### Rule C — 컴포넌트 재사용 우선

```
PostCard / RoomCard / Feed / PostForm
  → 광장 · 마당 · 거실 · 검색 · 프로필
```

차이는 **필터 + Scope**만. 재사용 가능하면 새 컴포넌트를 만들지 않는다.

### Rule D — CoreNull은 외형만

판단·추천·번역·채팅·의미분석은 CoreHub / CoreRing / CoreChat / HajunAI.  
CoreNull은 View·Space·진열만 담당한다.

---

## 0.2 Identity → House → Room → Post

```
Identity
  ↓
House   = Identity의 공간적 표현 (1인 1집)
  ↓
Room    = 이야기가 사는 공간
  ↓
Post    = Room 안에서만 의미 있음
```

- House 정체성 표현 = **Hero** (배경 + 집주인 얼굴 + 집 소개)
- 마당 Hero = 외부인이 보는 집 이미지
- 거실 Hero = 내가 이웃에게 보여주는 이미지
- Hero 콘텐츠도 **Post 재사용**

---

## 0.3 Scope 계층 (페이지 복제가 아님)

```
광장 (넓은 탐험: 국가 → 도시 → 마을)
  모든 사람 · 이야기 발견 · 관심으로 이웃 관계
        ↓ Scope 좁아짐
마당 (최종 목적지 · CoreNull 메인)
  내 주소·문패 · 내 프로필 · 내 방 · 이웃 방
  방문자가 “이런 이웃과 산다”를 보고 관계 맺음
        ↓ Scope 좁아짐
거실 (나만의 흐름)
  내 방 목록 + 최근 글 · 이웃은 여기서 나를 관찰
  공개방 입장 가능
        ↓
방 (Room 상세 · 공동 포스팅 View)
```

Scope = **쿼리 필터 + 진열 위치**. 데이터 구조를 새로 만들지 않는다.

---

## 0.4 Seed / Flower / Fruit (Room 상태 · 비복제)

```
Room
  ├── Seed (0~1개)     ← 발행자 = Room Creator
  ├── Participants[]   ← 같은 씨드를 함께 키움 (복제 없음)
  ├── Posts[]          ← 공동 작성 가능
  └── Fruit (0~1개)    ← 소유권 = Seed Publisher 고정
```

| 상태 | 의미 | 시점 (확정) |
| :--- | :--- | :--- |
| **Seed** | 스스로에게 한 약속 · 이벤트방 승격 | bloom/event 일자 설정 |
| **Growth** | 씨드방 안 기록 | 카운트다운 중 Post |
| **Flower** | 꽃이 핌 | **완료 7일 전** |
| **Fruit** | 열매 | **이벤트일 종료 다음날** |

### 열매 보관 vs 진열

- **보관(Source of Truth)** = 항상 **서재**. 이동·복사 없음.
- **진열** = 마당 / 거실 / 도서관 등에 **보이게 하는 상태값**만 변경.

### 소유권

```
Room Creator = Seed Publisher = Fruit Owner
```

참여자: 같이 기록·성장·열매를 **만들 수 있음**. 소유권은 없음.

### 참여방

일반방 / 이웃방 / 비공개방 / 씨드방 **모두** 이웃 초청 → 같은 View 공유 → 공동 포스팅 가능.  
“참여”는 방 유형과 **직교하는 축**이다.

### 씨드 진열 매트릭스 (복제 아님 · View만)

| 방 유형 | 참여 | 씨드·열매 **진열** 위치 | 가시 범위 |
| :--- | :--- | :--- | :--- |
| 공개방 씨드 | 단독 | 광장 + 마당 | 누구나 |
| 이웃방 씨드 | 단독 | 거실 | 이웃 범위 |
| 공개방 참여 씨드 | 공동 | 참여자 **각자의 마당** (같은 Seed View) | 참여자 마당 방문 범위 |
| 이웃방 참여 씨드 | 공동 | 참여자 **각자의 거실** | 참여자 거실 방문 범위 |
| 비공개방 참여 씨드 | 공동 | 참여자 **각자의 거실** | **초청·참여 이웃만** |
| 비공개 | — | — | **초청·참여 이웃만** |

---

## 0.5 서재 / 도서관 / 창고

| 개념 | 역할 | 비고 |
| :--- | :--- | :--- |
| **서재** | 열매·기록의 **보관** (SoT) | 열매는 무조건 서재에 존재 |
| **도서관** | 서재에서 **발행**한 열매 진열 | 이후 단계 · 상거래 가능 |
| **창고** | 커머스·실거래 상품 | 더 이후 · 랜덤 매칭 등 |

흐름: `열매 생성 → 서재 보관 → (선택) 진열 상태 on → (나중) 도서관 발행 → (더 나중) 수익`

---

## 0.6 Core 경계

| Core | 역할 | 하지 않는 것 |
| :--- | :--- | :--- |
| **CoreNull** | 공간(View) 제공 | 추천/판단/우선순위/의미분석 안 함 |
| **CoreHub** | 판단(Decision) | 공간 안 만듦. 현재 pause |
| **HajunAI** | 사고(Mind) | 공간 안 만듦. 현재 v5 보류 |
| **CoreRing** | 언어(Language) | Identity 자체 발급 안 함, CoreNull 걸 씀 |
| **CoreChat** | 흐름(Flow) | 공간 안 만듦 |

---

## 1. 확정된 Primitive (변경 없음)

```
Identity → House → Room → Post
Seed / Flower / Fruit = Room 상태값 (별도 테이블·객체 아님)
Participants = 같은 Room/Seed를 공유하는 멤버 (복제 없음)
```

**클로2(HajunAI)**: `house_snapshots.content.rooms[].seed_mode`는 별도 Seed 객체가 아니라 **Room 상태값**으로 해석. Knowledge Unit 생성 시 이 Primitive를 따를 것.

---

## 2. View Scope Architecture

```
Primitive → View Scope (무엇을 보여줄지) → Experience
                    ↓ (선택)
           Presentation 재정렬 = CoreHub, pause 중 미적용
```

| Experience | 정의 | View Scope | Phase |
| :--- | :--- | :--- | :--- |
| **광장** | 넓은 탐험 · 발견 | public Room/Seed (House 무관) | A |
| **마당** | 집의 얼굴 · 나+이웃 | 이 House public + 이웃 방 (이웃=B) | A(집주인) / B(이웃) |
| **거실** | 나만의 흐름 | 내 House Room + 최근 글 | A |
| **방** | 단건 상세 · 공동 포스팅 | 해당 Room | 기존 |
| **서재** | 보관 SoT | 내 열매·기록 | A (UI) |
| **도서관** | 발행 진열 | 발행된 열매 | 이후 |
| **창고** | 커머스 | 상품 매칭 | 이후 |

---

## 3. Phase A — 지금 당장 실행

재사용 컴포넌트(Room Card, Feed, Post Form)를 먼저 만들고 조합한다.

### A-1. Room Card (공통)
- Room 이름, 최근 활동 요약, 참여자 수, 최근 활동 시각
- 소개가 아니라 **최근 활동** · 클릭 → Room 또는 해당 House 마당

### A-2. 광장
- public Scope · Room Card 리스트
- 카드 → 그 House **마당** (Room 직접 진입 아님)

### A-3. 거실
- 내 House 전체 · 내 방 + 최근 글
- 다른 사람 콘텐츠 끌어오지 않음

### A-4. 마당 — 집주인 파트
- 이 House public Room/Seed/Fruit 진열
- 이웃 섹션은 자리만 비우거나 숨김 (Phase B)

### A-5. 서재
- 열매·기록 보관 View · 복제 없음 · 쿼리만

---

## 4. Phase B — 대기

1. 마당 이웃 섹션 — ADR-ACCESS-002 (`corenull_neighbors`)
2. Presentation 재정렬 — CoreHub pause 해제 후
3. 나이테(Hero Ring) — 클로4 컨셉 확정 후
4. 도서관 발행 · 창고 커머스

---

## 5. 이미 완료 (재작업 금지)

- ADR-ACCESS-001 Phase 1 — 배포·검증 완료
- LinkCredential (invite/recover) — 완료
- House 1인1집 + 홈=Room목록 — 완료
- CoreRing SEO (ADR-SEO-001) — 완료 (CoreNull 무관)
- context_package `agent=clo3` + CoreNull `dev_contexts` row — 2026-08-01 해소

---

## 6. 실행 순서

```
1. Room Card (A-1)
2. 거실 (A-3)
3. 광장 (A-2)
4. 마당 집주인 (A-4)
5. 서재 (A-5)
```

Phase A 완료 후 Phase 0(House/Yard/Library 골격) 사실상 종료 → Phase B 재검토.

---

## 7. 다른 Core 함의

### 클로2 (HajunAI)
- seed_mode = Room 상태 · Seed 엔티티 복제 해석 금지
- sync_snapshot은 House→Room→Post + 단일 Seed/Fruit 모델

### 클로5 (CoreRing)
- 번역/SEO는 Post·Room 단위 · Primitive 변경 없음

### AI 구현 금지 예시
- ❌ 참여자마다 Seed/Fruit 복제
- ❌ 광장/마당/거실 전용 데이터 테이블
- ❌ 동일 리스트 UI를 Experience마다 새로 구현
