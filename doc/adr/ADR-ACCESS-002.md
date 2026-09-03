# ADR-ACCESS-002: Neighbor 성립 방식과 골목(NeighborContentBlock) 노출 범위

**기준일:** 2026-08-23  
**상태:** Active — 승인 완료  
**대상:** 클로3 (CoreNull), 클로4 (CoreHub)  
**선행 문서:** ADR-NEIGHBOR-000 (Neighbor는 관계다, 권한이 아니다)  
**상위:** CoreNull_Core_Principles (Anchor), ADR-NEIGHBOR-000  
**충돌 시:** 상위 문서가 이긴다.

> DB 상태값 등 구현 세부는 이 ADR의 결정 범위 밖이다. 구현 단계에서 판단한다.

---

## 0. 이 문서가 결정하는 것 / 안 하는 것

### 결정하는 것 (ADR-NEIGHBOR-000 §5가 남겨둔 항목)

- `corenull_neighbors` 스키마
- Neighbor 성립 트리거 (요청/수락)
- Access 정책과의 연동 여부
- 골목(NeighborContentBlock)이 노출하는 범위

### 결정하지 않는 것

- 골목 UI의 구체적 시각 디자인 (레이아웃, 컴포넌트 스타일 — 클로4 디자인 작업 범위)
- 이웃 요청/수락 화면의 UX 세부 흐름 (버튼 위치, 알림 문구 등)
- 이웃 관계 기반 향후 확장 기능(활동 피드 등) — 이번 MVP 범위 밖, 의도적으로 제외

---

## 1. 결정 사항

### 1-1. Neighbor 성립 방식 — 요청 → 수락

```text
A가 B에게 이웃 신청
     ↓
B가 수락
     ↓
Neighbor 관계 성립 (상호적)
```

자동 발견(같은 마당에 나타나면 자동으로 이웃 성립)은 **채택하지 않는다.**  
자동 발견 방식은 “관계”와 “방문/발견”을 섞어버려서, ADR-NEIGHBOR-000이 세운 “Neighbor는 상호 인지 상태”라는 정의와 어긋난다.

마당은 이미 public이라 이웃 여부와 무관하게 발견 가능하며, Neighbor는 그 위에 얹히는 **별도의 관계 승낙 절차**다.

**해지:** ADR-NEIGHBOR-000 원칙대로 **일방 해지 가능.** 한쪽이 해지하면 관계는 소멸한다.  
재요청은 가능하다 (쿨다운 등 세부 제약은 이번 범위 밖, 필요 시 구현 단계에서 결정).

### 1-2. 골목(NeighborContentBlock)이 보여주는 것 — 목록 + 입구

```text
마당
 └─ 골목
     ├─ 이웃 A
     ├─ 이웃 B
     └─ 이웃 C
```

골목은 **이웃 목록**과, 그 이웃의 공간(마당)으로 들어가는 **입구**로 한정한다.

**의도적으로 제외하는 것:** 이웃의 “최근 활동” 같은 피드성 콘텐츠는 이번 MVP에 넣지 않는다.  
처음부터 피드를 넣으면 CoreNull이 지금까지 피해온 방향(결과·활동 중심 취합)으로 기울 수 있다.  
골목은 관계를 발견하고 탐색하는 공간이지, 활동을 모아 보여주는 피드가 아니다.

**이웃 클릭 시 이동:** 이웃의 마당 (`/houses/[houseId]/yard`)으로 이동한다.  
이미 존재하는 “공개 Room 발견 → 마당 진입” 경로를 재사용하는 것이며, 별도의 “이웃 전용 뷰”를 새로 만들지 않는다.

### 1-3. Neighbor와 Access의 관계 — 비연동

```text
Neighbor ≠ Room 접근 권한
```

Neighbor 관계가 성립해도 invite/family 등급 Room에 대한 접근 권한이 **자동으로 부여되지 않는다.**  
필요하면 Room Owner가 별도로 초대한다.

이는 ADR-NEIGHBOR-000 §4가 “Access 정책 쪽에서 별도로 결정”하도록 열어두었던 지점을 **닫는 결정**이다 — **연동하지 않는다.**  
Neighbor는 발견을 쉽게 만드는 관계 레이어일 뿐, 접근의 열쇠가 아니다.

---

## 2. 스키마

```text
corenull_neighbors
  id
  house_a_id       -- 요청한 House
  house_b_id       -- 요청받은 House
  status           -- 'pending' | 'accepted'
  requested_at
  responded_at     -- nullable, 수락/거절 시각
  created_at
```

- **House 단위**로 성립 (Room 단위 아님 — ADR-NEIGHBOR-000 §4 유지)
- `status='accepted'`가 Neighbor 관계 성립의 **단일 진실 공급원.** boolean 컬럼을 별도로 두지 않는다 (CoreNull `harvested_at IS NOT NULL` 패턴과 동일한 원칙).
- 해지 시 관계는 **소멸**한다 (ADR-NEIGHBOR-000 원칙, 일방 해지 가능).  
  이를 DB에 어떻게 저장하는지(행 삭제 vs 별도 status)는 이 ADR이 결정하지 않는다.  
  구현자가 CoreNull 기존 저장 패턴을 확인해 정한다 — 이 문서가 확정하는 것은 **“관계가 소멸한다”**는 사실까지다.

---

## 3. API 흐름 (개략)

```text
pending
 ├─ accept → accepted
 ├─ reject → 관계 성립 안 됨
 └─ cancel → 관계 성립 안 됨
```

1. A → B 이웃 신청: `pending` 상태로 관계 시작
2. B가 수락: `accepted`로 전환, 관계 성립
3. B가 거절 또는 A가 신청 취소: 관계는 성립하지 않는다
4. 이후 한쪽이 해지: 관계 소멸 (§2 원칙과 동일)

각 전이를 DB에 어떻게 저장하는지(row 삭제 vs `rejected`/`ended` 같은 status 값 사용 여부)는 이 ADR이 결정하지 않는다.  
실제 필요성이 생겼을 때 구현 단계에서 판단한다.  
이 문서가 확정하는 것은 위 **상태 전이 다이어그램**까지다.

---

## 4. Validation Check (Anchor §10 기준)

1. 이 기능이 Message 없이 존재할 수 있는가?  
   → `corenull_neighbors`는 관계 데이터이며 콘텐츠 Primitive가 아니므로 해당 없음 (ADR-NEIGHBOR-000과 동일 논리).

2. 중복 로직인가?  
   → Access 정책과 명시적으로 비연동시켰으므로 `canReadRoom` 로직과 중복되지 않는다.

3. House(Container)에 비즈니스 로직이 들어가는가?  
   → Neighbor 판정은 관계 테이블에서 이루어지며, 골목(NeighborContentBlock)은 목록 표시 + 이동만 담당하는 View. 위반 아님.

---

## 5. 다음 단계

- `corenull_neighbors` 마이그레이션 작성
- 이웃 신청 / 수락 / 해지 API 구현
- 골목(NeighborContentBlock) 실제 조립 — 지금까지 참고자료로 쌓아둔 목업(45:55 비율, selected index 구조 등)을 이 ADR 승인을 기준으로 재검증 후 구현 착수
- PostBlock 확장 props (`showInterest` 등, 하트/말풍선/공유 아이콘) — 이 ADR 승인을 기준으로 함께 착수 가능

---

_PM 반영: Grok — 2026-09-03 (승인 완료 문서 정리·저장)_
