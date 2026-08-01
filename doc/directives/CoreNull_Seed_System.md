# CoreNull Seed System v1.1 (View + State Layer)

_기준일: 2026-08-01_  
_상태: Active — 2026-08-01 Seed View 설계 확정 반영_  
_이전 버전과의 차이: Seed/Fruit를 새로운 콘텐츠 타입으로 취급하던 매핑을 제거하고, View + State 모델로 통일_

---

## 0. 한 문장 원칙

> CoreNull의 Primitive는 Message / Image / Comment뿐이다.  
> Seed는 새로운 콘텐츠가 아니라, 기존 Room과 그 안의 Posts를 바라보는 **View + State**다.

새 기능이 필요하면 먼저 묻는다:

```
이것은 새로운 데이터인가?
아니면 기존 데이터를 새로운 View / State로 표현하는 것인가?
```

후자라면 Primitive를 만들지 않는다.

---

## 1. Primitive 고정 (변경 없음)

```
Message
Image
Comment
```

이 세 가지 외에 새로운 콘텐츠 타입은 만들지 않는다.

---

## 2. Seed의 본질

Seed는 **Room과 그 안의 Posts를 바라보는 하나의 View Layer**다.

```
Room + Posts
    ↓
Seed View Layer
```

- Seed는 데이터가 아니다.
- Seed는 기존 Room/Post에 적용되는 **관점(View)** + **상태(State)**다.
- 구현 선택지를 과도하게 제한하지 않는다.  
  (DB 컬럼, 파생 필드, 렌더링 플래그 등 어떤 방식으로든 State를 표현할 수 있다. 중요한 것은 “새 Primitive가 아니다”라는 원칙이다.)

---

## 3. Seed LifeCycle (State)

Seed View 내부 상태는 다음과 같이 진행된다.

```
Seed → Growing → Flower → Fruit
```

| 상태 | 의미 | 비고 |
| :--- | :--- | :--- |
| **Seed** | 시작 · 스스로에게 한 약속 | 발행자 = Room Creator |
| **Growing** | 성장 · 기록 중 | Posts가 쌓이는 구간 |
| **Flower** | 진행률 약 80~90% / 완료 7일 전 | |
| **Fruit** | 종료 · 해당 기간의 기록을 결과 View로 표현 | |

### State의 주체 (용어 통일)

- **기본 귀속**: Room  
  (Room당 하나의 활성 Seed를 기본 모델로 한다. 참여자 수만큼 복제·포크 금지)
- Post는 Room 안에서 공동으로 작성되며, Seed View는 그 Room의 Posts를 특정 관점으로 렌더링한다.
- 구현 시 Room 단위 State를 우선하고, 필요하면 Post에 파생 표시를 둘 수 있다.  
  핵심은 “State는 기존 엔티티에 붙는 값”이라는 점이다.

---

## 4. Fruit와 Harvest의 관계

- **Fruit** = 종료된 Seed View와 그 기간의 기록을 표현하는 **결과 View**다.  
  새로운 객체가 아니라 Seed LifeCycle의 마지막 상태 + 결과 표현이다.
- **Harvest** = Fruit가 생성된 후, 사용자가 그 결과를  
  **마당 / 거실 / 서재** 중 어디에 둘지 결정하는 **배치(View) 변경**이다.

```
Fruit (결과 View)
    ↓
Harvest → Yard / Living / Library  (위치 View)
```

- 원본 데이터의 Source of Truth는 **Message**이다.
- 서재는 Fruit 결과물을 보관·관리하는 **View**이다.
- 마당·거실·도서관은 진열 상태값만 변경한다.
- 이동·복사가 아니라 **보이는 위치**만 바뀐다.

---

## 5. View Layer 구조 (중첩 가능)

View는 배타적이지 않다. 레이어처럼 쌓일 수 있다.

```
Base Post
    ↓
Participation Layer   (참여 중인가?)
    ↓
Seed Layer            (Seed 진행 중인가?)
    ↓
최종 화면
```

예시:

- 일반 포스트
- 참여 중인 포스트
- Seed 진행 중인 포스트
- **참여 중인 Seed 포스트**  ← Participation + Seed Layer 동시 적용

필요 시 앞으로도 Search Layer / Highlight Layer / Translation Layer 등을 같은 방식으로 확장 가능하다.

---

## 6. 소유권과 참여

```
Room Creator = Seed Publisher = Fruit Owner
```

- 참여자 = 같은 Seed를 함께 키움 (복제 없음)
- 참여자는 기록·성장·열매를 **만들 수 있지만**, 소유권은 없다.
- “참여”는 방 유형(공개/이웃/비공개)과 **직교하는 축**이다.

---

## 7. 구현 시 주의사항 (Architecture Guard)

- ❌ 참여자마다 Seed/Fruit 복제·포크
- ❌ 광장/마당/거실 전용 데이터 테이블 신설
- ❌ Seed를 새로운 Message type으로 취급
- ✅ State는 기존 Room/Post에 붙인다
- ✅ View는 필터 + Scope + 렌더링 레이어로 표현한다
- ✅ 컴포넌트 재사용 우선 (PostCard / RoomCard / Feed 등)

---

## 8. BrainPool 공통 설계 원칙 (재확인)

```
Data + State + View
```

대부분의 기능은 이 세 가지 조합으로 구현한다.  
Primitive(Message / Image / Comment)는 변하지 않는다.  
변하는 것은 State와 View뿐이다.

---

_검토: Grok (PM) — 2026-08-01_  
_승인: 클로1 (총괄) — 대기_
