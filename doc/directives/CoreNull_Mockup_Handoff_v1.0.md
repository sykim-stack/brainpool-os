# CoreNull Mockup Handoff Contract v1.0

**수신**: 클로3 (구현), 클로4 (디자인)  
**작성**: Grok (PM)  
**날짜**: 2026-08-06  
**성격**: 클로4 목업 → 클로3 소스 매핑을 위한 **공통 주입 문서**.  
양쪽 세션 시작 시 이 문서를 함께 넣는다.

상위 기준: `CoreNull_Core_Principles_v1.2.md` (Anchor) > 이 문서 > 목업 스타일.

---

## 0. 한 줄 원칙

> 클로4는 **보이는 것**만 정한다. 클로3는 **이미 있는 소스**에 붙인다.  
> 설명 문서 없이 **HTML 목업 소스**만 넘긴다.

---

## 1. 역할 분담 (고정)

| 역할 | 하는 일 | 하지 않는 일 |
| :--- | :--- | :--- |
| **클로4** | 화면 구조·시각 언어·목업 HTML | 제품 코드, 새 테이블, API 설계 확정 |
| **클로3** | 목업 → `brainpool-corenull` 매핑·구현 | 시각 언어 재발명, 긴 디자인 서술 |

흐름:

```
클로4 목업 HTML
    ↓  (소스만, 설명 최소화)
클로3 기존 app/ + components/ 에 매핑
    ↓
Phase A Experience (Room Card → 거실 → 광장 → 마당 → 서재)
```

---

## 2. 양쪽이 공유하는 데이터 모델 (매핑 기준)

저장은 이것뿐:

```
Message  — 글·이미지·영상·댓글
Room     — owner_key, visibility + 스위치 4개
House    — Identity의 공간 표현 (1인 1집)
```

Room 스위치 (표시만, 상태 머신 아님):

```
seed_started_at     timestamp | null
seed_target_date    timestamp | null   → 목표형(값) / 성장형(null)
has_participants    boolean            → 참여자 여부(파생 가능)
harvested           boolean            → 서재 노출
```

진행률 배지 (뷰 계산, DB 저장 금지):

```
0% 🌱 / 1~79% 🌿 / 80~99% 🌸 / 100%+ 🍎
target_date null → "🌿 성장" 고정
```

---

## 3. Experience ↔ 기존 소스 매핑표

레포: `sykim-stack/brainpool-corenull`

| Experience (IA) | 의미 | 기존 라우트 / 파일 | 클로4 목업 대응 |
| :--- | :--- | :--- | :--- |
| **마당 (Yard, 홈)** | 방문자가 보는 집 | `app/yard/page.tsx`, `app/api/corenull/yard` | `corenull-yard-home-final.html` |
| **거실 (Living)** | 내가 보는 내 집 | `app/me/page.tsx`, `app/houses/[houseId]` | `corenull-livingroom-final.html` |
| **방 (Room)** | Room 상세·공동 포스팅 | `app/rooms/[id]/RoomClient.tsx` | `corenull-room-detail.html` |
| **서재 (Library)** | harvested=true 모음 | `app/me/library/page.tsx`, `api/.../library` | `corenull-library-final.html` |
| **광장 (Plaza)** | public 발견 (Phase A는 카드/뱃지) | `app/page.tsx` 등 public 목록 | 마당 상단 뱃지 / 추후 |
| **글쓰기** | Message 작성 | `app/write/page.tsx` | (필요 시 별도 목업) |
| **탭바** | 하단 3탭 | `components/corenull/TabBar.tsx` | 목업 공통 하단 탭 |
| **공유** | Share | `components/corenull/ShareModal.tsx` | — |
| **Room 설정** | 스위치·visibility | `components/corenull/RoomSettingsModal.tsx` | 스위치 UI는 Owner만 |

### 컴포넌트 재사용 규칙 (클로3·클로4 공통)

- **카드 1계열**: 풀블리드 이미지 + 오버레이(캡션/배지). 방·씨앗·마당·서재 전부 변형 = 필터·배지만.
- 새 화면마다 새 카드 컴포넌트를 만들지 않는다.
- 차이 = **Scope 필터 + 스위치 배지 + 진열 위치**.

---

## 4. 목업 → 코드 매핑 규칙 (클로4가 지킬 것)

목업 HTML을 넘길 때 아래를 지키면 클로3 매핑 비용이 줄어든다.

### 4.1 data-* 힌트 (권장)

주요 블록에 의미를 붙인다. 클래스는 자유, **data 속성으로 역할을 고정**.

```html
<section data-scope="yard|living|room|library|plaza">
<article data-primitive="room-card" data-seed-badge="sprout|grow|bloom|fruit|none">
<div data-switch="seed|participants|harvested" data-state="on|off">
<header data-part="hero|nameplate|tabbar">
```

### 4.2 금지 (목업에서도)

- "1단계 시작 / 2단계 전환 / 종료" 같은 **상태 머신 카피**
- Seed/Fruit **개수**를 세는 UI 카피
- 광장·마당·거실 전용 **가짜 데이터 구조** 암시 (실제로는 같은 Room 리스트)
- Owner가 아닌 참여자에게 스위치 조작 버튼 노출

### 4.3 허용 카피

- 켜다 / 끄다, 배지 🌱🌿🌸🍎, "성장", "서재에 두기", "공개방"

### 4.4 핸드오프 형식

```
1. HTML 파일 1개 = 화면 1개 (파일명 유지 또는 명확히)
2. 변경 요지 3줄 이내 (선택)
3. 긴 설명 MD 금지
```

---

## 5. 클로3 매핑 체크리스트 (받기 직후)

```
□ 이 블록은 기존 어느 라우트/컴포넌트에 붙는가? (§3 표)
□ 새 테이블/컬럼이 필요한가? → 거의 항상 NO (Anchor §10)
□ 카드/리스트를 새로 짜지 않고 재사용할 수 있는가?
□ 배지는 seed_started_at / seed_target_date 뷰 계산인가?
□ 스위치 조작 UI는 Owner only인가?
□ 상태 머신 언어가 카피/변수명에 없는가?
```

막히면: 새 Primitive 추가 전에 PM/클로1에 한 줄 보고.

---

## 6. 시각 언어 (클로4 확정 · 클로3 준수)

| 항목 | 값 |
| :--- | :--- |
| 시그니처 | 나이테(growth ring) — 프로필 프레임 |
| 팔레트 | ink `#232A20` / parchment `#EDE7D8` / moss `#5C6B4C` / rust `#8C4B37` / brass `#A6813F` / mist `#C7C0AC` / gold `#C9A24B` |
| 폰트 | Noto Serif KR (제목) / Noto Sans KR (본문) / IBM Plex Mono (수치) |
| 카드 | 1계열 재사용 |
| 워드마크 | CORE/NULL 2톤 + 골드 틱 (CoreRing 패밀리) |

히어로·프로필 사진 = 별도 업로드 폼 없이 **기존 Post 미디어 지정**.

---

## 7. Phase A 작업 순서 (공통)

```
1. Room Card (공통 + 배지)
2. 거실
3. 광장 (public Room Card)
4. 마당 집주인
5. 서재 (harvested View)
```

클로4가 목업을 보강할 때도 이 순서를 우선한다.  
Phase B(이웃·광장 본편·CoreHub 가중 나이테)는 이 문서 범위 밖.

---

## 8. 세션 주입 목록 (복붙용)

**클로4 / 클로3 공통**

1. `doc/directives/CoreNull_Core_Principles_v1.2.md`
2. `doc/directives/CoreNull_Mockup_Handoff_v1.0.md` ← 이 문서
3. `doc/status/CORENULL_ROADMAP.md`
4. 각자 Contract: `contexts/clo4.md` 또는 `contexts/clo3.md`

선택:

```
GET .../api/hajun?action=context_package&agent=clo3
GET .../api/hajun?action=context_package&agent=clo4
```

---

## 9. 완료 정의 (이번 라운드)

- [ ] 핸드오프 문서 양쪽 주입
- [ ] 클로4: Phase A 우선 화면에 대해 data-* 힌트 반영 목업 (필요 분)
- [ ] 클로3: §3 매핑표 기준으로 Room Card → 거실부터 구현 착수
- [ ] 새 테이블/상태머신 언어 없이 머지 가능한 PR 단위

---

_검토: Grok (PM) — 2026-08-06_  
_승인: 클로1 대기 / 함장 지시로 작업 개시 가능_
