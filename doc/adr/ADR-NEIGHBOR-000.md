# ADR-NEIGHBOR-000: Neighbor의 의미와 경계 (Phase B-0)

**기준일:** 2026-08-20  
**상태:** Draft (의미 경계 채택 권고) — ADR-ACCESS-002 선행 문서  
**대상:** 클로3 (CoreNull), 클로4  
**상위:** CoreNull_Core_Principles (Anchor), CORENULL_ROADMAP  
**충돌 시:** Anchor가 이긴다.

---

## 0. 이 문서가 결정하지 않는 것

- Neighbor 테이블 스키마 (`corenull_neighbors` → ADR-ACCESS-002)
- `canJoinRoom()` / `canReadRoom()` 구현 방식
- 마당 이웃 섹션 UI
- Neighbor 요청/수락 플로우

이 문서는 **Neighbor가 무엇인가**만 결정한다. 구현은 ADR-ACCESS-002.

---

## 1. 질문

이웃(Neighbor) = 접근 권한인가, 발견되는 관계인가?

| | 접근 권한으로 정의 | 관계로 정의 |
|--|-------------------|-------------|
| Neighbor란 | Room을 읽거나 참여할 자격 | House↔House가 서로의 존재를 인지하는 상태 |
| 데이터 | Access 정책 확장 | House 간 관계 (콘텐츠 Primitive 아님) |
| 끊었을 때 | 접근 차단 = 관계 소멸로 묶임 | Access는 별도 유지 가능 |
| 확장성 | canReadRoom에 갇힘 | 이웃 피드·알림 등으로 확장 가능 |

---

## 2. 결정

**Neighbor는 관계다. 권한이 아니다.**

```text
Neighbor = House ↔ House 사이에 성립하는 상호 인지 상태
         (서로의 마당을 발견/방문/연결할 수 있다는 사실 그 자체)

Access(누가 무엇을 읽을 수 있는가)는 Neighbor와 별도의 정책이다.
Neighbor 관계가 있다고 접근 권한이 자동으로 생기지 않는다.
접근 권한이 있다고 Neighbor 관계가 자동으로 생기지 않는다.
```

연동은 가능하되 종속되지 않는다.  
예: “이웃이면 invite 등급 Room을 볼지”는 Access가 Neighbor 상태를 **입력값 중 하나**로 참조하는 것이지, Neighbor = Access가 아니다.

---

## 3. 근거

1. **의미가 먼저** (Master_Prompt) — Neighbor를 canReadRoom 파생 플래그로 두면 의미가 사라진다.
2. **콘텐츠 Primitive 아님** — Message/Room을 담지 않는 House 간 관계 레이어. 관계 테이블 ≠ 새 콘텐츠 Primitive.
3. **과설계 방지** — “관계다” 경계만 긋고, 생애주기는 ACCESS-002에서 MVP로 제한.
4. **미래 안정성** — Access 규칙이 바뀌어도 Neighbor 의미는 유지.

### Participant와 구분

| | Neighbor | Participant |
|--|----------|-------------|
| 단위 | House ↔ House | Room |
| 의미 | 상호 인지 관계 | 해당 Room 공동 포스팅 축 |
| 권한 | 자동 부여 없음 | 포스팅 가능 · 스위치 조작은 Owner만 |

---

## 4. Neighbor MVP 범위 (참고 — ACCESS-002에서 확정)

- House 단위 성립 (Room 단위 아님)
- 상호적 (양측 인지 상태; 일방 follow는 본 ADR 범위 밖)
- 관계 자체는 접근 권한을 부여하지 않음
- 마당(public)은 Neighbor 없이도 발견 가능 — Neighbor는 친밀·발견 레이어
- invite/family에 Neighbor를 조건으로 넣을지는 Access 쪽에서 별도 결정

---

## 5. 다음 단계 (ADR-ACCESS-002)

- `corenull_neighbors` 스키마
- 성립 트리거 (요청/수락 vs 자동)
- Access 연동 지점 (있다면 어디까지)
- 마당 이웃 섹션 노출 방식

---

## 6. Validation (Anchor)

1. Neighbor는 콘텐츠 Primitive가 아니며 Message 원자성을 깨지 않는다.
2. canReadRoom과 정책 분리 → 로직 중복 없음.
3. House 컴포넌트에 비즈니스 로직을 넣지 않음 — 관계 테이블에서 판정.

---

_PM 검토: Grok — 2026-08-20 (의미 경계 채택 권고)_
