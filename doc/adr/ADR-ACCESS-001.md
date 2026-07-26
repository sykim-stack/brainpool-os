# ADR-ACCESS-001: Room Visibility 읽기 권한 제어 (Neighbor / Participation)

**날짜**: 2026-07-25
**작성**: 클로3 (CoreNull)
**상태**: Proposed — 클로1(Architecture) + Planning 승인 대기
**관련 문서**: Master_Prompt_v2.0.md §15(SEO Source Rule), CoreNull Room & Seed Concept Specification v1.0, Identity Platform Architecture — Decision Log(2026-07-19)

---

## 배경

CoreNull의 `Room.visibility`는 `public | invite | family` 3단계로 이미 구현되어 있다.
그런데 실제 코드를 확인한 결과, 이 값은 두 곳에만 쓰이고 있었다.

```
1. 마당(Yard) 피드 노출 여부 — public만 마당에 뜸
2. SEO 색인 여부 — public이 아니면 noindex (Master Prompt §15)
```

**정작 "이 방을 볼 수 있는가"를 막는 읽기 권한 체크가 어디에도 없다.**
`app/rooms/[id]/RoomClient.tsx`, `app/api/corenull/posts/route.js` GET 모두
`room_id`만 알면 visibility 값과 무관하게 메시지를 그대로 반환한다.
`isMember` 체크는 존재하지만 이건 "쓰기 권한"만 판단하며, 읽기와는 무관하다.

즉 지금까지 `family`(비공개)로 설정한 방도, URL(room_id)만 알면 누구나 내용을 볼 수 있는 상태다.
이것은 리네이밍 문제가 아니라 실제 접근 제어 기능이 처음부터 없었던 것이며,
Neighbor/Participation 개념을 도입하려면 이 갭을 먼저 메워야 한다.

---

## 확정된 매핑

여러 라운드 논의 끝에 아래로 확정됨 (2026-07-25 저녁).

```
public  (공개)   → 마당에 들어온 누구나. 접근 제한 없음. (현행 유지)
invite  (이웃)   → 방이 속한 House와 "이웃" 관계(House↔House)가 있는 사람만.
family  (비공개) → 그 Room에 초대되어 등록된 사람만. 이웃 관계와 무관.
                    (이웃보다 좁은 범위 — "이웃도 못 보는 방")
```

두 단계의 스코프가 서로 다른 Primitive를 요구한다는 게 이번 논의의 핵심 발견이다.

- `family` 접근 제어는 **Room 단위 초대 리스트 확인만으로 충분** — 새 Primitive 불필요.
- `invite` 접근 제어는 **House↔House "이웃" 관계**라는, 지금 없는 개념을 필요로 한다 — 신규 경량 Primitive 하나 필요.

이 차이 때문에 아래처럼 **단계를 분리해서 진행**하기로 한다.

---

## 결정

### Phase 1 — `family`(비공개) 접근 제어 (이웃 Primitive 불필요, 즉시 착수 가능)

**스키마 변경**: `corenull_house_members`에 `room_id uuid NULL` 컬럼 추가.

```
room_id IS NULL   → 기존 동작 그대로 (House 전체 멤버 — corenull_invite_tokens,
                     LinkCredential invite target이 지금 만드는 레코드가 이 형태)
room_id 값 있음   → 특정 Room에만 국한된 등록 — family 방의 "초대된 사람" =
                     동시에 "그 방에 포스팅 가능한 참여자"
```

기존 House-level 멤버십과 완전히 같은 테이블을 재사용하고, `room_id`라는 선택적 스코프만
얹는 구조라 하위 호환이 깨지지 않는다. "참여(포스팅 권한)"와 "family 방 읽기 권한"이
동일한 레코드로 표현되므로 데이터 중복이 생기지 않는다 (Single Source of Truth 유지).

**읽기 권한 체크 로직** (신규):
```
room.visibility === 'family' 인 경우
  → requester_owner_key가 house owner 이거나,
    corenull_house_members에 (house_id, room_id=이 방, device_id=requester) 레코드가 있어야 접근 허용
  → 아니면 403 상당의 _error 반환 (Pipeline Contract상 status는 500 유지, _error 코드로 구분)
```

**적용 위치**:
```
app/api/corenull/posts/route.js   GET ?room_id= / ?post_id=
app/api/corenull/rooms/route.js   GET ?room_id=
```
공통 헬퍼 함수(`checkRoomAccess(room, requesterOwnerKey)`)로 양쪽에서 재사용.

> `?post_id=` 단건 조회(posts/[postId] 상세 페이지)가 현재 가장 노출이 큰 경로다.
> post_id만 알면 room의 visibility와 무관하게 바로 content가 반환되기 때문에,
> family 방의 글이라도 post 링크 하나로 우회 열람이 가능한 상태다. Phase 1에서 반드시 같이 막는다.

---

### Phase 2 — `invite`(이웃) 접근 제어 (신규 Primitive 필요, Phase 1 이후 설계 착수)

**신규 테이블**: `corenull_neighbors` (가칭, House↔House 관계)

```
corenull_neighbors
  id
  house_id_a       -- 관계의 양쪽 (순서 무관하게 다루거나, requester/target으로 구분)
  house_id_b
  status            -- 'pending' | 'accepted'
  requested_by      -- house_id_a 또는 house_id_b, 누가 먼저 신청했는지
  created_at
  accepted_at
```

"발견"은 이 관계가 생기는 **경로**(마당에서 랜덤 방문 → 포스팅 보고 신청 → 수락)일 뿐,
데이터 모델의 상태값이 아니다. 실제 `status`는 `pending`/`accepted` 두 가지면 충분하고,
`accepted` 상태만 "이웃"으로 취급한다.

**읽기 권한 체크 로직** (신규):
```
room.visibility === 'invite' 인 경우
  → requester_owner_key가 house owner 이거나,
    corenull_neighbors에서 (requester의 house_id, room이 속한 house_id)가
    status='accepted'로 존재해야 접근 허용
```

Phase 2는 이웃 관계 UI(신청/수락 흐름, 마당에서의 발견 경로)까지 같이 설계해야 하므로
별도 ADR 섹션 또는 후속 ADR로 확장 검토.

---

## 대안 검토 (기각)

**대안: family도 이웃 Primitive로 처리 (참여자 = 이웃의 부분집합)**
→ 기각. family는 "이웃도 못 보는" 더 좁은 범위이므로 이웃 관계에 종속시키면
   오히려 개념이 꼬인다. family와 invite는 서로 다른 축(Room 단위 vs House 단위)이라
   독립적으로 체크하는 게 Working Guide의 "Experience ≠ Primitive" 원칙에도 더 맞는다.

**대안: `corenull_house_members`를 그대로 두고 별도 `room_participants` 테이블 신설**
→ 기각. Room & Seed Concept Spec에서도 이미 "새로운 Seed Primitive 생성 금지, 기존 구조
   재사용"을 원칙으로 못박았고, `room_id` nullable 컬럼 하나로 같은 효과를 낼 수 있어
   New Primitive is the Last Choice 원칙에 더 부합한다.

---

## 영향 범위

```
- corenull_house_members: 스키마 변경 (room_id 컬럼 추가, nullable이라 기존 데이터 영향 없음)
- app/api/corenull/posts/route.js: GET 핸들러에 접근 제어 로직 추가
- app/api/corenull/rooms/route.js: GET 핸들러에 접근 제어 로직 추가
- app/api/corenull/invite/route.js: 미변경 (house-level 초대는 room_id 없이 그대로)
- app/api/identity/route.js (LinkCredential): 미변경, 다만 invite target을 향후
  room 단위로 확장할 여지는 남겨둠 (지금은 손대지 않음)
- Phase 2에서 corenull_neighbors 신규 테이블 추가 예정
```

## 리스크 / 마이그레이션 고려사항

```
- 지금 family/invite로 설정된 기존 방이 있다면, Phase 1/2 배포 즉시
  "링크만 알면 보이던 것"이 막힌다 — 의도된 동작이지만 급격한 변화이므로
  배포 전 기존 family/invite 방 목록과 소유자를 먼저 확인해 사전 고지 필요.
- 긴급도: 낮음. 현재 실사용자가 1명뿐이라 즉시 배포 압박이 없고,
  ADR 정상 승인 절차(Architecture + Planning)를 기다릴 시간이 있다.
```

---

## Next Step

```
- [ ] 클로1(Architecture) + Planning 검토/승인
- [ ] 승인 후 클로3 작업지시서 발행 (Phase 1)
- [ ] Phase 1 구현: house_members.room_id 컬럼 + posts/rooms GET 접근 제어
- [ ] Phase 1 검증 후 Phase 2(이웃 Primitive) 설계 착수
- [ ] Agent_Repo_Mapping.md / clo3.md에 완료 반영
```

---

_승인 (Architecture): 대기_
_승인 (Planning): 대기_