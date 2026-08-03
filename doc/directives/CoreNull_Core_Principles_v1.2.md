# CoreNull 핵심 원칙 v1.2 (Anchor)

**수신**: 클로3 (CoreNull), 클로4 (CoreNull 디자인 컨셉 지원)  
**날짜**: 2026-08-02  
**성격**: 앞으로 모든 CoreNull 설계 판단의 최상위 기준.  
이 문서와 충돌하는 표현이 나오면 **이 문서가 이긴다**.  
기존 `CORENULL_ROADMAP.md` §0.4(Seed/Flower/Fruit 표), `CoreNull_Seed_System.md` 전체를 이 문서 기준으로 대체한다.

---

## 0. 조직 변경 (선반영)

- PM 담당: 마누스 → 그록
- `Master_Prompt_v2.0.md` §4는 이미 "Grok (PM)"으로 반영 완료됨 (2026-08-01) — 추가 조치 불필요.

---

## 1. 구조는 절대 안 바뀐다

```
Message (+ 이미지/영상, 댓글도 Message)
    ↓
Room (Message를 담는 최소한의 그릇 — owner_key, visibility만 저장)
```

CoreNull이 실제로 저장하는 건 이 둘뿐이다.  
나머지(씨드, 참여, 서재, 거실, 마당, 광장)는 전부 이 위에 얹는 **View**이거나 **스위치**다.

**오해 방지**: 이 원칙은 "데이터를 어떻게 저장할지"에 대한 것이지  
"어떤 기능을 화면에 보여줄지"를 제한하지 않는다.  
씨드 진행률 표시, 열매 배지, 수확 버튼, 참여자 관리 UI — 전부 그대로 있어야 한다.  
다만 그 값들을 별도 테이블에 저장하지 말고, Room의 스위치 값(§2)에서 계산해서 보여준다.

---

## 2. 레이어는 스위치다, 상태 머신이 아니다

씨드/참여/서재는 Room에 붙였다 뗄 수 있는 **on/off 스위치**다.  
"시작→진행→종료"처럼 순서가 정해진 여정이 아니다.

**저장 컬럼 (Room, 총 4개)**

```
Room.seed_started_at    (timestamp, null 가능)  ← 켜짐 = 값 있음, 꺼짐 = null
Room.seed_target_date   (timestamp, null 가능)  ← 목표형/성장형 구분 (§4 참고)
Room.has_participants   (참여자 있는지 여부)
Room.harvested          (서재에 노출할지 여부, boolean)
```

이 넷은 서로 **독립적으로** 켜고 끌 수 있다.  
"씨드+참여" 동시 가능, "씨드 껐다가 나중에 다시 켜기" 가능,  
전부 컬럼 값만 바뀌는 거지 Message는 절대 이동·삭제·복제되지 않는다.

진행률(%)은 **저장하지 않는다**. 화면에서 그때그때 계산만 한다.  
100%를 넘어도 그냥 배지만 바뀔 뿐, 포스팅은 계속 가능하다.

---

## 3. 써도 되는 단어 / 쓰면 안 되는 단어

문서·코드 주석·변수명 어디서든 아래를 지킨다.

| ✅ 쓸 것 | ❌ 쓰지 말 것 |
| :--- | :--- |
| 켜다 / 끄다 | 시작하다 / 전환하다 / 종료하다 |
| 값이 있다 / 없다 | 진행 중이다 / 단계 |
| 계산한다(표시용) | 저장한다(진행률을) |
| — | 개수 (Seed/Fruit를 셀 수 있는 것처럼) |
| — | 포기하다 (그냥 "끈다"로 충분) |

이 단어들이 서술에 등장하면, **상태 머신으로 새고 있다는 신호**다.

---

## 4. Seed 두 가지 타입 (목표형 / 성장형)

새 컬럼 없이 `seed_target_date`의 유무만으로 두 타입을 커버한다.

| Seed 타입 | 켤 때 | 진행 중 | 종료 |
| :--- | :--- | :--- | :--- |
| **목표형** | `seed_target_date` = 미래 날짜 입력 | 진행률 자동 계산 | target_date 도달 시 자동 열매 |
| **성장형** | `seed_target_date` = null | "성장 🌿" 고정 표시 (진행률 없음) | 주인이 "종료" 버튼 → `seed_target_date = now` 세팅 → 즉시 열매 |

즉 "성장형 종료"는 새 액션이 아니라 **목표형 계산식에 뒤늦게 값을 채워 넣는 것**이다.

---

## 5. 진행률 계산 (뷰 레이어, 저장 안 함)

```
progress% = (now - seed_started_at) / (seed_target_date - seed_started_at)

0%      = 씨앗 🌱
1~79%   = 성장 🌿
80~99%  = 꽃 🌸
100%+   = 열매 🍎
```

`seed_target_date`가 null(성장형 진행 중)이면 진행률 계산 자체를 스킵하고 "성장 🌿" 고정.

---

## 6. visibility — Room 단위 즉시 전체 적용

- visibility(공개/이웃공개/가족) 변경은 **Room 전체에 즉시 적용**된다.
- 과거 글만 예전 공개범위를 유지하는 기능은 만들지 않는다 — Message별 visibility 스냅샷은 §2 스위치 원칙 위반이므로 금지.

---

## 7. Ownership

- 스위치(seed 켜기/끄기, visibility 변경, harvested 토글) 조작 권한은 **Room 개설자(Founder/Owner) 한 명만**.
- 참여자는 포스팅(Message 작성)은 가능하지만 Room의 스위치 값 자체는 건드릴 수 없다.

---

## 8. Access Control과의 관계 (ADR-ACCESS-001/002)

이 스위치들(seed, participants, harvested)은 **접근 제어와 완전히 무관**하다.  
`canReadRoom()` / `canReadPost()`는 오직 **visibility**만 보고 판단한다.  
family + seed 동시 상태인 방도 접근 제어는 기존 policy 그대로 적용되고,  
seed 진행률은 순수 **Display Layer**다  
(ADR-ACCESS-001의 "Display Policy와 Access Policy 분리" 원칙과 일치).

---

## 9. View Scope Architecture(광장/마당/거실/서재) 안에서의 표현

- 광장/마당에 "Seed 전용 피드", "Fruit 전용 피드"가 따로 존재하지 않는다.
- 노출되는 건 `visibility=public`인 **Room 하나**뿐이고, 그 Room이 지금 seed가 켜져 있으면 §5 계산에 따른 배지(🌱🌿🌸🍎)가 **같은 Room Card**에 붙는 것뿐이다.
- 서재도 "Fruit라는 별도 레코드 모음"이 아니라, `Room.harvested = true`인 Room들을 모아 보여주는 **View**다.
- `CORENULL_ROADMAP.md` §0.4의 Seed(0~1개) / Fruit(0~1개) 표는 §3 금지어("개수") 위반이므로 이 문서 기준으로 전면 수정한다.

---

## 10. 새 아이디어가 나왔을 때 판단 순서

```
① 새 테이블/새 컬럼(Message, Room 이외)이 필요한가?
   YES → 정말 필요한지 다시 검토 (최후의 수단)
   NO ↓
② 기존 Message/Room을 다른 조건으로 필터링하면 되는가?
   YES → View 추가로 끝
   NO ↓
③ Room에 스위치(boolean/timestamp) 하나 얹으면 되는가?
   YES → 그걸로 끝
   NO → CoreHub/CoreRing/HajunAI 영역인지 확인 (CoreNull 일이 아닐 수 있음)
```

---

## 11. 클로3 작업 완료 현황 (1단계 — 문서화)

| 대상 | 상태 |
| :--- | :--- |
| CORENULL_ROADMAP.md §0.4, §2 재작성 | ✅ 완료 |
| CoreNull_Seed_System.md 폐기 → 이 문서로 대체 | ✅ 완료 (deprecation stub) |
| Master_Prompt_v2.0.md §4 PM 표기 정정 | 이미 반영 (2026-08-01) |
| clo3.md Seed/Fruit 서술 갱신 | ✅ 완료 |

---

## 12. 마이그레이션 경로 — seed_mode/bloom_date → 4개 스위치 컬럼

**현재 스키마**

```
corenull_rooms.seed_mode      boolean
corenull_rooms.bloom_date     timestamp | null
messages.harvested_at         timestamp | null  (type='fruit'인 Message에만 존재)
```

**목표 스키마**

```
corenull_rooms.seed_started_at   timestamp | null
corenull_rooms.seed_target_date  timestamp | null
corenull_rooms.has_participants  boolean
corenull_rooms.harvested         boolean
```

**결론**: 컬럼명 변경(rename)이 아니라 **"병행 운영 후 폐기"**로 간다.  
이유는 의미가 1:1로 대응하지 않기 때문이다.

- `seed_mode`(on/off)와 `seed_started_at`(시작 시점)은 타입 자체가 다르다 — 단순 rename 불가.
- `bloom_date`는 `seed_target_date`와 값 자체는 거의 동일하지만, 새 모델에서는 이 값의 유무가 "목표형/성장형"을 가르는 의미를 새로 갖는다.
- `harvested`는 지금 Room이 아니라 Message(type='fruit')에 있다 — Room 레벨로 옮기는 것 자체가 데이터 소재지 변경이다.

**단계**

```
1) corenull_rooms에 신규 컬럼 4개 추가 (전부 nullable/false 기본값, 기존 로우 영향 없음)
2) 백필
   - seed_started_at ← seed_mode=true인 Room의 created_at (근사치;
     감사 로그가 있으면 그걸 우선)
   - seed_target_date ← bloom_date 값을 그대로 복사
   - has_participants ← corenull_house_members에 해당 room_id 매핑이
     1개 이상인 Room만 true
   - harvested ← messages에 (room_id 소속, type='fruit', harvested_at IS NOT NULL)이
     하나라도 있는 Room만 true
3) 프론트/API를 신규 컬럼 기준으로 전환, 두 스키마 병행 운영
   (구 컬럼 read-only, 신규 쓰기 금지)
4) 검증 완료 후 구 컬럼 참조 코드 제거
5) DROP COLUMN은 검증 기간 후 별도 승인 (Master Prompt §6 · ADR)
```

이 마이그레이션은 "1단계 — 문서화" 범위를 넘는 실제 스키마 변경이므로,  
이번 라운드에서는 실행하지 않는다. 실행은 별도 작업지시서로 받는다.

---

## 13. 참여방 접근 제어 — ADR-ACCESS-002 완료 전 처리 방식

결론: 참여방의 최소 기능(읽기 접근 제어)은 **이미 동작**한다.  
ADR-ACCESS-002가 다루는 "이웃"과 §7의 "참여자"는 **서로 다른 축**이다.

```
이웃(Neighbor)     = House ↔ House 관계 → 광장/마당 "발견" 경로
                   → ADR-ACCESS-002 대상, 미구현 (canJoinRoom() stub)
참여자(Participant) = 특정 Room 단위 포스팅 권한
                   → ADR-ACCESS-001 Phase 1에서 이미 구현 완료
```

- `corenull_house_members.room_id`(nullable)가 이미 있고, 이 값이 채워진 레코드가 "그 Room의 참여자"다.
- `has_participants`는 새 데이터가 아니라 이 값의 존재 여부에서 계산 가능한 **파생값**이다 (§10 ②).
- family(비공개) Room 읽기 접근 제어는 `canReadRoom()`이 이 room_id 매핑 기준으로 판단 (ADR-ACCESS-001 Phase 1, 2026-07-26 배포·검증 완료).
- 참여자 등록도 LinkCredential `target=invite` 또는 `corenull_invite_tokens`로 이미 가능.
- 남아있는 미구현은 오직 "이웃"(House 간 관계)이며, ADR-ACCESS-002 스코프.

§7 Ownership의 "참여자는 포스팅 가능 / 스위치는 못 건드림" 중 앞부분은 **지금 시점에 이미 성립**한다.  
`has_participants` 스위치를 Room에 추가하는 것은 §12 마이그레이션과 함께 진행하면 되고,  
그 전까지는 `corenull_house_members` 조회로 계산해서 표시해도 무방하다.

---

_검토: Grok (PM) — 2026-08-02_  
_승인: 클로1 (총괄) — 승인_
