# CoreNull UI Architecture — Master View + Block System v1.0

**Status:** Architecture Direction  
**Purpose:** CoreNull UI 설계·구현 기준  
**Audience:** 클로3 / 클로4 / CoreNull 개발 에이전트  
**상위:** CoreNull Anchor v1.2 · CORENULL_ROADMAP  
**충돌 시:** Anchor가 이긴다.

---

## 1. 가장 중요한 변경

**House 중심 UI 개념을 제거한다.**

House는 UI 화면·Card·Layout·Block·Header가 아니다.  
House는 마당·거실·서재를 통틀어 부르는 **Domain 상위 개념**이다.

```text
House (Domain)
 ├─ 마당
 ├─ 거실
 └─ 서재
```

사용자가 이동·보는 공간은 **마당 / 거실 / 서재**다.  
신규 설계에서 House Card / House Page / House Layout / House Block / House Header를 쓰지 않는다.

---

## 2. 공간 구조

```text
광장
 └─ 공개 Room 발견
      ↓
    마당
      ├─ 거실
      └─ 서재
```

광장의 발견 단위는 **House가 아니라 Room**이다.  
Room Card → 마당 (밖에서 본 집 모습 + 공개·이웃 공개방 최신 포스트).

---

## 3. Master View + Block

새 Layout을 공간마다 만들지 않는다.  
**하나의 Master View**에서 Block을 ON/OFF·조합한다.

```text
Master View
 ├─ HeroBlock        ON/OFF
 ├─ RoomBlock        ON/OFF
 ├─ SeedBlock        ON/OFF
 ├─ PostBlock        ON/OFF
 ├─ ImageBlock       ON/OFF
 ├─ CommentBlock     ON/OFF
 ├─ NeighborBlock    ON/OFF  (ADR-ACCESS-002 전 OFF)
 ├─ RecentContentBlock ON/OFF
 └─ EmptyStateBlock  ON/OFF
```

Content 데이터와 View 표시 상태를 분리한다.  
Post에 `show_in_yard` 같은 View 전용 필드를 넣지 않는다.

---

## 4. Content와 View

- Content: 내용 · 이미지 · 작성일 · 댓글
- House / Room / 공개범위 / 씨앗 / 열매 / 참여는 **View에서 표현**
- Post가 주인공. Room 이름은 하단 메타
- 같은 Post가 마당·거실·서재에서 다르게 보일 수 있음 (데이터 복제 아님)

---

## 5. Display Policy ≠ Access Policy

Block ON ≠ 읽기 가능. 접근 가능 ≠ 현재 View에 반드시 표시.  
(ADR-ACCESS-001과 동일 원칙을 UI까지 유지)

---

## 6. Navigation

| 현재 위치 | 로고 옆 | 동작 |
|-----------|---------|------|
| 다른 집 공간 | 🏠 | 나의 마당 |
| 나의 마당 | 광장 아이콘 | 광장 |
| 나의 내부(거실·서재 등) | 🏠 | 나의 마당 |
| 광장 | 🏠 | 나의 마당 |

---

## 7. 새 화면 요청 시 질문

❌ 새 페이지를 어떻게 만들까?  
✅ Master View에서 어떤 Block을 ON/OFF 할까?

1. Context는 무엇인가?
2. 필요한 Block / 끌 Block?
3. Access 있는가?
4. Navigation은 어디로?

---

## 8. Final Rule

- 페이지를 만들지 않는다. Block을 조합한다.
- House UI를 만들지 않는다. 마당·거실·서재를 만든다.
- 콘텐츠에 화면 정보를 넣지 않는다. View가 표현을 결정한다.
- 권한과 표시를 섞지 않는다.
- 가능하면 기존 Master View + Block + Context로 해결한다.

---

_함장 확정 방향 · PM 반영 2026-08-20_
