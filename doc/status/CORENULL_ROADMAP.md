# CoreNull 실행 로드맵
_기준일: 2026-07-31 / 갱신: 2026-08-02 (Seed 스위치 모델 v1.2 Anchor 반영)_
_수신: 클로3 (코어널)_
_상태: Active — Phase A 실행 중_

목적: 철학·설계 논의를 걷어내고, **지금 당장 실행 가능한 순서**만 정리.  
설계 원칙의 최상위 근거는 `doc/directives/CoreNull_Core_Principles_v1.2.md` (Anchor)다.  
이 로드맵과 Anchor가 충돌하면 **Anchor가 이긴다**.

---

## 0. 한 문장 원칙 (모든 판단 기준)

> CoreNull은 껍데기다. 글-이미지-댓글, 이것만 존재한다.

새 요청이 오면 항상 이 순서로 판단한다:

1. 새 Primitive 필요? → 아니면
2. 기존 Primitive의 View Scope? → 그것도 아니면
3. Room에 스위치(boolean/timestamp) 하나면 되는가? → 그걸로 끝
4. CoreHub / CoreRing / HajunAI 영역 (CoreNull이 할 일 아님)

---

## 0.1 CoreNull 고정 원칙 (Architecture Guard — 최우선)

### Rule A — 공간(데이터)을 만들지 않는다. View를 만든다.

광장 / 마당 / 거실 / 서재 / 도서관은 **새 테이블·새 Primitive가 아니다.**  
동일한 `House → Room → Message`를 **Scope·스위치·진열**만 바꿔 보여주는 View다.

### Rule B — 복제·포크 금지

Room·Message를 참여자 수만큼 복사하지 않는다.  
DB에는 **하나의 Room / 그 안의 Messages**만 존재한다.  
각 집에 보이는 것은 복제본이 아니라 **같은 대상을 바라보는 View**다.

### Rule C — 컴포넌트 재사용 우선

```
PostCard / RoomCard / Feed / PostForm
  → 광장 · 마당 · 거실 · 검색 · 프로필
```

차이는 **필터 + Scope + 배지**만. 재사용 가능하면 새 컴포넌트를 만들지 않는다.

### Rule D — CoreNull은 외형만

판단·추천·번역·채팅·의미분석은 CoreHub / CoreRing / CoreChat / HajunAI.  
CoreNull은 View·Space·스위치·진열만 담당한다.

### Rule E — 스위치, 상태 머신 아님 (Anchor §2·§3)

씨드/참여/서재는 Room에 붙였다 뗄 수 있는 **독립 on/off 스위치**다.  
"시작→진행→종료" 여정·단계·개수 언어를 쓰지 않는다.

---

## 0.2 Identity → House → Room → Message

```
Identity
  ↓
House   = Identity의 공간적 표현 (1인 1집)
  ↓
Room    = Message를 담는 최소한의 그릇 (owner_key, visibility + 스위치)
  ↓
Message = 글·이미지·영상·댓글
```

- House 정체성 표현 = **Hero** (배경 + 집주인 얼굴 + 집 소개)
- 마당 Hero = 외부인이 보는 집 이미지
- 거실 Hero = 내가 이웃에게 보여주는 이미지
- Hero 콘텐츠도 **Message 재사용**

---

## 0.3 Scope 계층 (페이지 복제가 아님)

```
광장 (넓은 탐험: 국가 → 도시 → 마을)
  모든 사람 · 이야기 발견 · 관심으로 이웃 관계
        ↓ Scope 좁아짐
마당 (최종 목적지 · CoreNull 메인)
  내 주소·문패 · 내 프로필 · 내 방 · 이웃 방
  방문자가 "이런 이웃과 산다"를 보고 관계 맺음
        ↓ Scope 좁아짐
거실 (나만의 흐름)
  내 방 목록 + 최근 글 · 이웃은 여기서 나를 관찰
  공개방 입장 가능
        ↓
방 (Room 상세 · 공동 포스팅 View)
```

Scope = **쿼리 필터 + 진열 위치**. 데이터 구조를 새로 만들지 않는다.

---

## 0.4 Seed 스위치 모델 (Anchor §2·§4·§5)

Room에 붙는 **4개 독립 스위치** (서로 무관하게 켜고 끌 수 있음):

```
Room.seed_started_at    (timestamp | null)  — 값 있음 = 씨드 켜짐
Room.seed_target_date   (timestamp | null)  — 목표형/성장형 구분
Room.has_participants   (boolean)           — 참여자 있는지 (파생 가능)
Room.harvested          (boolean)           — 서재 노출 여부
```

| 타입 | 켤 때 | 표시 | 끄기/열매 |
| :--- | :--- | :--- | :--- |
| **목표형** | seed_target_date = 미래 | 진행률 계산 → 🌱🌿🌸🍎 | target_date 도달 시 배지 열매 |
| **성장형** | seed_target_date = null | "성장 🌿" 고정 | 주인이 target_date=now 세팅 → 즉시 열매 배지 |

- 진행률(%)은 **저장하지 않는다**. 뷰에서만 계산.
- Message는 이동·삭제·복제되지 않는다.
- 스위치 조작 권한 = **Room Creator(Owner) 한 명만**. 참여자는 포스팅만 가능.
- 서재 = `harvested=true`인 Room을 모은 **View** (별도 Fruit 레코드 없음).
- 광장/마당에 Seed·Fruit 전용 피드 없음. public Room Card에 배지만 붙는다.

상세·금지어·마이그레이션: `CoreNull_Core_Principles_v1.2.md`

---

## 0.5 서재 / 도서관 / 창고

| 개념 | 역할 | 비고 |
| :--- | :--- | :--- |
| **서재** | harvested=true Room 모음 View | Message SoT는 그대로 Message |
| **도서관** | 서재에서 발행한 결과 진열 | 이후 단계 |
| **창고** | 커머스·실거래 | 더 이후 |

---

## 0.6 Core 경계

| Core | 역할 | 하지 않는 것 |
| :--- | :--- | :--- |
| **CoreNull** | 공간(View) · 스위치 | 추천/판단/우선순위/의미분석 안 함 |
| **CoreHub** | 판단(Decision) | 공간 안 만듦. 현재 pause |
| **HajunAI** | 사고(Mind) | 공간 안 만듦. 현재 v5 보류 |
| **CoreRing** | 언어(Language) | Identity 자체 발급 안 함, CoreNull 걸 씀 |
| **CoreChat** | 흐름(Flow) | 공간 안 만듦 |

---

## 1. 확정된 Primitive (변경 없음)

```
Identity → House → Room → Message
스위치 4개 = Room 컬럼 (별도 테이블·객체 아님)
Participants = 같은 Room을 쓰는 멤버 (복제 없음)
```

**클로2(HajunAI)**: 구 `seed_mode` / 신 스위치 모두 **Room 값**으로 해석.  
Seed 엔티티·개수 복제 해석 금지. Knowledge Unit 생성 시 Anchor 준수.

---

## 2. View Scope Architecture

```
Message + Room → View Scope (필터·스위치·배지) → Experience
```

| Experience | 정의 | View Scope | Phase |
| :--- | :--- | :--- | :--- |
| **광장** | 넓은 탐험 · 발견 | visibility=public Room (+ 배지) | A |
| **마당** | 집의 얼굴 · 나+이웃 | 이 House public + 이웃 방 | A(집주인) / B(이웃) |
| **거실** | 나만의 흐름 | 내 House Room + 최근 글 | A |
| **방** | 단건 상세 · 공동 포스팅 | 해당 Room | 기존 |
| **서재** | harvested=true 모음 | 내 harvested Room | A (UI) |
| **도서관** | 발행 진열 | 이후 |
| **창고** | 커머스 | 이후 |

---

## 3. Phase A — 지금 당장 실행

재사용 컴포넌트(Room Card, Feed, Post Form)를 먼저 만들고 조합한다.

### A-1. Room Card (공통)
- Room 이름, 최근 활동 요약, 참여자 표시, 최근 활동 시각
- seed 켜져 있으면 §0.4 배지(🌱🌿🌸🍎) 표시 (뷰 계산)
- 클릭 → Room 또는 해당 House 마당

### A-2. 광장
- public Scope · Room Card 리스트
- 카드 → 그 House **마당** (Room 직접 진입 아님)

### A-3. 거실
- 내 House 전체 · 내 방 + 최근 글
- 다른 사람 콘텐츠 끌어오지 않음

### A-4. 마당 — 집주인 파트
- 이 House public Room 진열 (+ 배지)
- 이웃 섹션은 자리만 비우거나 숨김 (Phase B)

### A-5. 서재
- harvested=true Room 모음 View · 복제 없음 · 쿼리만

---

## 4. Phase B — 대기

1. 마당 이웃 섹션 — ADR-ACCESS-002 (`corenull_neighbors`)
2. Presentation 재정렬 — CoreHub pause 해제 후
3. 나이테(Hero Ring) — 클로4 컨셉 확정 후
4. 도서관 발행 · 창고 커머스
5. 스위치 4컬럼 마이그레이션 (Anchor §12 — 별도 작업지시)

---

## 5. 이미 완료 (재작업 금지)

- ADR-ACCESS-001 Phase 1 — 배포·검증 완료
- LinkCredential (invite/recover) — 완료
- House 1인1집 + 홈=Room목록 — 완료
- CoreRing SEO (ADR-SEO-001) — 완료 (CoreNull 무관)
- context_package `agent=clo3` + CoreNull `dev_contexts` row — 2026-08-01 해소
- CoreNull Anchor v1.2 + Seed_System 폐기 + clo3 정합화 — 2026-08-02

---

## 6. 실행 순서

```
1. Room Card (A-1)  — 배지 표시 포함
2. 거실 (A-3)
3. 광장 (A-2)
4. 마당 집주인 (A-4)
5. 서재 (A-5)
```

Phase A 완료 후 Phase B 재검토.

---

## 7. 다른 Core 함의

### 클로2 (HajunAI)
- 구 seed_mode / 신 스위치 = Room 값 · 엔티티·개수 복제 해석 금지
- sync_snapshot은 House→Room→Message + 스위치 모델

### 클로5 (CoreRing)
- 번역/SEO는 Message·Room 단위 · Primitive 변경 없음

### AI 구현 금지 예시
- ❌ 참여자마다 Room/Message 복제
- ❌ 광장/마당/거실 전용 데이터 테이블
- ❌ Seed/Fruit "개수"·상태 머신 언어
- ❌ 진행률(%) DB 저장
- ❌ 동일 리스트 UI를 Experience마다 새로 구현
