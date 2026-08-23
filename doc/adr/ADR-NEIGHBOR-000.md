# ADR-NEIGHBOR-000: Neighbor의 의미와 경계 (Phase B-0)

**기준일:** 2026-08-20  
**상태:** Draft — ADR-ACCESS-002 선행 문서  
**대상:** 클로3 (CoreNull), 클로4 (CoreHub)  
**상위:** CoreNull_Core_Principles (Anchor), CORENULL_ROADMAP  
**충돌 시:** Anchor가 이긴다.

---

## 1. 이 문서가 결정하지 않는 것

- Neighbor 테이블 스키마 (`corenull_neighbors` 구조는 ADR-ACCESS-002에서 정의)
- `canJoinRoom()` / `canReadRoom()` 구현 방식
- 마당 이웃 섹션 UI
- Neighbor 요청/수락 플로우

이 문서는 **Neighbor가 무엇인가**만 결정한다. “어떻게 구현할까”는 다음 문서(ADR-ACCESS-002)의 몰이다.

---

## 2. 질문

이웃(Neighbor) = 접근 권한인가, 발견되는 관계인가?

두 해석은 서로 다른 시스템으로 이어진다.

| | 접근 권한으로 정의 | 관계로 정의 |
|--|-------------------|-------------|
| Neighbor란 | Room을 읽거나 참여할 수 있는 자격 | House와 House가 서로의 존재를 인지하는 상태 |
| 데이터 소유자 | Access 정책 (`canReadRoom` 확장) | **House 간 관계 엔티티(비-콘텐츠)** |
| 끊었을 때 | 접근이 막힘 = 곧 이웃 관계 소멸 | 접근 정책은 별도로 유지될 수 있음 |
| 확장성 | `canReadRoom` 로직에 갖혀 좁아짐 | 나중에 “이웃 활동 피드”, “이웃 알림” 등으로 자연 확장 가능 |

---

## 3. 결정

**Neighbor는 관계다. 권한이 아니다.**

```text
Neighbor = House ↔ House 사이에 성립하는 상호 인지 상태
         (서로의 마당을 발견/방문/연결할 수 있다는 사실 그 자체)

Access(누가 무엇을 읽을 수 있는가)는 Neighbor와 별도의 정책이다.
Neighbor 관계가 있다고 접근 권한이 자동으로 생기지 않는다.
접근 권한이 있다고 Neighbor 관계가 자동으로 생기지 않는다.
```

두 개념은 연동될 수 있지만 **종속되지 않는다.**  
예: “이웃이면 invite 등급 Room을 볼 수 있게 할지”는 Access 정책이 Neighbor 상태를 **입력값 중 하나**로 참조하는 것이지, Neighbor가 곧 Access인 것이 아니다.

---

## 4. 근거

1. **BRAINPOOL 원칙 정합성** — “기능보다 의미가 먼저” (Master_Prompt §1). Neighbor를 `canReadRoom()` 파생값으로 정의하면 의미가 없는 권한 플래그가 되어 이 원칙에 어갓난다.

2. **콘텐츠 Primitive가 아니다** — `corenull_neighbors`는 요청/수락 플로우, 상태값, 생성 시각을 가지는 독립적인 쓰기(write) 대상이므로 읽기전용 View가 아니라 **관계형 엔티티**다. 다만 이것이 Anchor §5 FORBIDDEN ACTIONS(새 콘텐츠 Primitive 금지)를 위반하는 것은 아니다. §5가 금지하는 것은 Post/Comment/Fruit처럼 **콘텐츠를 담는** Primitive를 중복 생성하는 것이지, House 간 관계를 기록하는 엔티티를 만들는 것이 아니다. Neighbor는 Message를 담지 않고 콘텐츠를 생성하지 않는다. 근거는 “View라서”가 아니라 **“콘텐츠 Primitive가 아니라 관계 데이터이기 때문”**이다.

3. **과설계 방지** — “관계 시스템”을 한 번에 풀 캔버스로 설계하지 않는다. 이 문서는 “관계다”라는 경계만 그에고, 요청/수락/알림 같은 관계의 생애주기는 ADR-ACCESS-002에서 MVP 범위로 제한한다.

4. **미래 안정성** — `canJoinRoom`/`canReadRoom`이 나중에 바뀌어도 Neighbor의 의미 자체는 흔들리지 않는다.

### Participant와 구분

| | Neighbor | Participant |
|--|----------|-------------|
| 단위 | House ↔ House | Room |
| 의미 | 상호 인지 관계 | 해당 Room 공동 포스팅 축 |
| 권한 | 자동 부여 없음 | 포스팅 가능 · 스위치 조작은 Owner만 |

---

## 5. Neighbor MVP 범위 (참고용, ADR-ACCESS-002에서 확정)

이 문서에서 결정하는 것은 아니지만, 위 경계를 따랐을 때 자연스럽게 좁혀지는 범위를 참고로 남긴다.

- Neighbor 관계는 **House 단위**로 성립한다 (Room 단위 아님 — Room은 Access 정책의 대상).
- Neighbor 관계는 **상호적**이다 (일방적 팔로우가 아니라 양쪽이 인지하는 상태).
- Neighbor 관계 자체는 **아무 접근 권한도 부여하지 않는다.** 마당(public)은 이미 누구나 볼 수 있으므로 Neighbor 없이도 발견 가능하다. Neighbor는 “발견을 더 쉽게/친밀하게 만들는 레이어”이지 “잠긴 문을 여는 열쇠”가 아니다.
- invite/family 등급 접근에 Neighbor 상태를 조건으로 넣을지는 Access 정책 쪽에서 별도로 결정하며, 이 문서는 그 가능성을 열어두기만 한다.
- **해지 원칙:** Neighbor는 상호적으로 성립하므로, 해지도 원칙적으로 **일방이 가능하다** (문을 여는 데는 상호 동의가 필요했지만, 닫는 데는 필요 없다). 구체적 상태 전이(차단 여부, 재요청 가능 시점 등)는 ADR-ACCESS-002에서 정의하되, 이 원칙(“해지는 일방 가능”)은 뒤집지 않는다.

**MVP 필수 조건:** ADR-ACCESS-002는 이 관계 테이블을 만들는 것만으로 끝나서는 안 된다. 사용자가 체감할 수 있는 **가시적 가치 최소 1개**를 포함해야 한다 (예: 이웃 목록 노출, 이웃의 최근 활동 표시 중 최소 하나). 관계 구조만 깔고 기능은 다음으로 미루는 “빈 테이블” 상태로 002를 종료하지 않는다.

---

## 6. 다음 단계 (ADR-ACCESS-002)

**참고:** 로드맵은 “House는 UI 객체가 아니다(House Card/Page/Block 신설 금지)”를 명시한다. 이 문서에서 House를 관계의 양 끝(House A ↔ House B)으로 쓰는 것은 이 원칙과 **충돌하지 않는다.** House는 `corenull_houses` 등으로 이미 존재하는 **데이터 엔티티(Domain)** 이며, 금지된 것은 House를 별도 화면/컴포넌트로 UI화하는 것이다. ADR-ACCESS-002를 읽는 클로3/4는 이 구분(**데이터 엔티티 vs UI 객체**)을 전제로 진행한다.

이 결정을 전제로 ADR-ACCESS-002에서 다음을 정의한다:

- `corenull_neighbors` 스키마 (House A ↔ House B, 상태값, 생성 시각)
- Neighbor 성립 트리거 (자동 발견 vs 요청/수락)
- Access 정책과의 연동 지점 (있다면 어디까지)
- 마당 이웃 섹션 UI가 이 관계를 어떻게 노출할지
- **일방 해지 시 상대에게 노출 여부** (조용히 soft-delete vs 명시적 표시) — §3 “상호 인지” 정의와 어긋나지 않도록 반드시 다루다

---

## 7. Validation Check (Anchor §10 기준)

1. 이 기능이 Message 없이 존재할 수 있는가? → Neighbor는 House 간 관계이며 콘텐츠가 아니다. Message 원자성 규칙과 별도 트랙. 콘텐츠 Primitive가 아니므로 §5 위반 아님.
2. 중복 로직인가? → `canReadRoom`과 별도 정책으로 분리했으므로 로직 중복 없음.
3. House(Container)에 비즈니스 로직이 들어가는가? → Neighbor 판정은 관계 테이블에서 이루어지며, House UI 컴포넌트는 레이아웃만 담당 유지. 위반 아님.

---

_PM 반영: Grok — 2026-08-20 (표현 통일 · 해지·MVP · 상대 노출을 §6에 명시) / 2026-08-23 섹션 넘버링 정정_
