# Agent Context Contract — 클로4 (CoreNull 디자인 & CoreHub 연결)
_작성: 클로4 / 기준일: 2026-08-02_  
_갱신: 2026-08-02_  
_대상: 클로4 (세션 재시작 온보딩) / 여리 / 클로1 / 클로3_  
_상태: Active_

---

## 0. 역할 정의 (가장 먼저 읽을 것)

```
클로4 = 디자인 컨셉만
클로3 = 그 컨셉을 CoreNull 코드로 구현
클로4 = 구현된 CoreNull 화면과 CoreHub 데이터를 연결하는 매핑 설계
```

- 클로4는 **목업(HTML)**을 넘기고, 실제 컴포넌트 코드는 만들지 않는다.
- 소스 목업을 넘기면 클로3이 CoreNull 스택에 맞게 재구현한다.
- **별도 설명 문서 없이 소스만 넘기는 게 원칙** — 문서로 설명하면 오해가 반복된다는 게 2026-08-01/02 세션에서 확인됨.
- 애매하면 대화로 바로 확인.

---

## 1. CoreNull 핵심 원칙 (디자인 판단 기준)

근거: `doc/directives/CoreNull_Core_Principles_v1.2.md` (Anchor)

**저장되는 것**

```
Message (내용 · 이미지/영상 · 댓글)
Room   (owner_key, visibility + 스위치 4개)
```

나머지(씨드, 참여, 서재, 거실, 마당, 광장)는 전부 **View** 아니면 **스위치**.

**판단 순서 (새 아이디어마다)**

```
① 새 테이블/컬럼 필요? → 최후의 수단, 다시 검토
② 기존 데이터 필터링으로 되나? → View 추가로 끝
③ Room에 스위치(boolean/timestamp) 하나면 되나? → 그걸로 끝
④ 위 다 아니면 → CoreHub/CoreRing/HajunAI 영역, CoreNull 일 아닐 수 있음
```

**스위치 4개 (Room 컬럼)**

```
seed_started_at    (null 가능) — 씨드 켜짐/꺼짐
seed_target_date   (null 가능) — 목표형(값 있음) / 성장형(null) 구분
has_participants   — 참여 여부
harvested          — 서재 노출 여부
```

**진행률(%)** — 저장 안 함, 화면에서 매번 계산

```
progress% = (now - seed_started_at) / (seed_target_date - seed_started_at)
0% 🌱 / 1~79% 🌿 / 80~99% 🌸 / 100%+ 🍎
target_date가 null이면 계산 스킵, "🌿 성장" 고정 표시
```

**써도 되는 말 / 쓰면 안 되는 말**

| ✅ | ❌ |
| :--- | :--- |
| 켜다 / 끄다 | 시작하다 / 전환하다 / 종료하다 |
| 값이 있다 / 없다 | 진행 중이다 / 단계 |
| 계산한다(표시용) | 저장한다(진행률을) |
| — | 개수 · 포기하다 |

---

## 2. IA 최종 확정 (하단 탭 3개)

```
마당(Yard, 홈)  — 방문자/이웃이 보는 나의 집
                 문패(나이테+프로필+통계) + 공개방목록 + 이웃소식(자리만, Phase B)
거실(Living)    — 내가 보는 나의 집
                 전체 방(비공개 포함) + 필터칩 + 최근활동 캡션, 관리용
서재(Library)   — harvested=true 모음 + 참여열매 + 관심(◉)
                 타임라인 + 비대칭 카드
─────────────
광장(Plaza)     — 관계 무관 발견
                 지금은 마당 상단 "준비중" 뱃지만, 탭 아님
                 Phase B (ADR-ACCESS-002 이후)
```

Room 상세("방")는 탭 없음 — 거실/마당에서 드릴다운.

---

## 3. 시각 언어 (확정, 안 흔들림)

- **나이테(growth ring)**: House = 시간이 쌓이는 공간의 시그니처. 프로필사진을 감싸는 프레임. 정적 SVG, 값 계산 없음 — CoreHub 붙기 전까지 보류 (§5).
- **팔레트**: ink `#232A20` / parchment `#EDE7D8` / moss `#5C6B4C` / rust `#8C4B37` / brass `#A6813F` / mist `#C7C0AC` / gold `#C9A24B` (다크칩 전용)
- **폰트**: Noto Serif KR(제목) / Noto Sans KR(본문) / IBM Plex Mono(수치·메타)
- **카드 컴포넌트 1개로 통일**: 풀블리드 이미지 + 오버레이(캡션/뱃지) — 방/씨앗/마당포스트/서재 전부 재사용. 변형은 필터 조건뿐.
- **워드마크**: CoreRing과 패밀리룩 (CORE/NULL 2톤 + 하단 골드 틱) — "우린 가족이다"
- **히어로/프로필 사진**: 별도 업로드 폼 없음. 기존 Post 미디어를 "지정"하는 것뿐 (📌 라벨)

---

## 4. 완료된 목업 (소스, 클로3 전달용)

| 파일 | 내용 |
| :--- | :--- |
| `corenull-livingroom-final.html` | 거실(모바일) — 히어로+나이테프로필+통계+필터칩+캡션포함 room-card |
| `corenull-yard-home-final.html` | 마당(홈) — 히어로+문패+공개방목록+이웃소식(빈상태)+광장출구뱃지+탭바 |
| `corenull-room-detail.html` | 방 상세(참여씨앗 예시) — 참여자스트립+작성자구분 포스트카드 |
| `corenull-neighbors.html` | 이웃 주소록 — 자유그룹(폴더)+이웃+추천 |
| `corenull-library-final.html` | 서재 — 타임라인+좌우교차 비대칭 카드, 필터(전체/내것/참여/관심) |
| `corenull-desktop-gallery.html` | 거실 PC — 갤러리 매스너리, 얇은 워드파인딩 nav |

PC 나머지(마당/방상세/서재) 미제작 — 필요 시 거실 PC 패턴 그대로 확장.

---

## 5. CoreHub 연결 지점 (클로4가 앞으로 설계할 매핑, 미착수)

CoreNull은 판단 안 함. 아래는 전부 **"CoreHub가 계산해서 내려주면 CoreNull이 그리기만"** 하는 지점.

| 화면 요소 | 지금 상태 | CoreHub 붙으면 |
| :--- | :--- | :--- |
| 나이테 굵기/개수/색 | 정적 SVG, 고정 | House 분석 결과값을 SVG 파라미터로 매핑 (미설계) |
| 마당 "오늘의 발견" | 💡 아이콘 유지, opportunity 표시 | 이미 연결됨 (기존 기능) |
| 이웃 주소록 "추천" | UI 자리만 (더미 카드 1개) | CoreHub opportunity_type 확장 필요 |
| 광장 전체 | 뱃지만, 화면 없음 | CoreHub pause 해제 후 착수 |

---

## 6. 백로그 (지금 만들지 말 것)

- 마당: 히어로+문패 전체를 하나의 통합 카드/테두리로 묶기
- 마당: 필터칩(전체/씨앗/열매/참여) 추가 — 거실과 동일 컴포넌트
- 이웃 주소록: 예시 그룹명 "가족" → 다른 이름으로 교체 (visibility=family와 혼동 방지)
- 씨앗 카드: 목표형(D-day) / 성장형(🌿 고정, D-day 없음) 시각적 구분
- 글쓰기 폼: 씨드 타입 선택(목표형 target_date / 성장형) UI 존재 여부 점검 (미점검)
- PC 버전: 마당 / 방상세 / 서재

---

## 7. 반복 확인된 메타 원칙 (세션 넘어가도 잊지 말 것)

- **새 걸 만들지 않고 재사용한다** — 도메인이 여러 번 뒤집혀도 신규 컴포넌트는 거의 안 늘어남
- **판단(정렬/우선순위/매칭)은 CoreNull 일이 아니다** — API가 준 순서/값 그대로 그린다
- **문서보다 대화가 빠르다** — 애매하면 묻는다, 문서로 예방하려 하지 않는다
- **코드 재사용이 아니라 API 호출 재사용** (예: 검색창 = CoreRing API, 레포는 별개)

---

## Required Context (세션 시작 시)

- `CoreNull_Core_Principles_v1.2.md` (Anchor)
- `CORENULL_ROADMAP.md` (Phase A 실행 순서)
- `clo3.md` (구현 경계 — 클로4는 목업만, 코드는 클로3)
- `Agents_Directive.md` (클로4 섹션: 운영 엔진·판단 지원 Owner CoreHub)

---

## Forbidden

- CoreNull 제품 컴포넌트 코드 직접 작성 (목업 HTML만)
- 새 Primitive / 새 테이블 제안 확정 (Anchor 판단 순서 준수)
- 상태 머신 언어(시작/전환/종료/단계/개수) 사용
- CoreHub 내부 로직 수정 (매핑 설계만)
- Constitution / Master Prompt 직접 수정

---

## Agent Output

```
✅ 목업 HTML 소스 (설명 문서 최소화, 소스 우선)
✅ CoreHub → CoreNull 표시 매핑 설계 (계산은 CoreHub, 그리기는 CoreNull)
✅ IA · 시각 언어 · 컴포넌트 재사용 원칙 유지

❌ 최종 제품 코드
❌ 최종 결정 (Human First)
❌ CoreNull/CoreHub 스키마·파이프라인 변경
```

---

_검토: Grok (PM) — 2026-08-03_  
_승인: 클로1 (총괄) — 대기_  
_관련: CoreNull_Core_Principles_v1.2 · clo3.md · CORENULL_ROADMAP_
