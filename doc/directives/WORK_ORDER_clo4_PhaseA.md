# 작업 지시서 — 클로4 (CoreNull 디자인) Phase A

**수신**: 클로4  
**작성**: Grok (PM)  
**날짜**: 2026-08-06  
**선행 문서 (세션 주입 필수)**:

1. `CoreNull_Core_Principles_v1.2.md`
2. `CoreNull_Mockup_Handoff_v1.0.md`
3. `CORENULL_ROADMAP.md`
4. `contexts/clo4.md`

---

## 목표

클로3가 **기존 `brainpool-corenull` 소스에 바로 매핑**할 수 있도록,  
Phase A 화면 목업을 **HTML 소스만**으로 정리·보강한다.

---

## 이번 작업 범위

### 우선순위

1. **Room Card** — 공통 카드 + 씨드 배지(🌱🌿🌸🍎 / 성장형 고정 🌿)
2. **거실** — `corenull-livingroom-final.html` 기준, data-* 힌트 보강
3. **마당** — `corenull-yard-home-final.html`
4. **서재** — `corenull-library-final.html`
5. **방 상세** — `corenull-room-detail.html` (참여자 스트립, 스위치는 Owner만)

광장 본편·이웃 주소록 고도화는 Phase B. 필요 시 마당 상단 "준비중" 뱃지만.

### 산출물

- HTML 목업 파일 (화면당 1파일)
- 파일 상단 또는 커밋 메시지에 **3줄 이내** 변경 요지
- **긴 설명 MD 작성 금지**

### 목업 필수 규칙 (`Mockup_Handoff` §4)

```html
data-scope="yard|living|room|library|plaza"
data-primitive="room-card"
data-seed-badge="sprout|grow|bloom|fruit|none"
data-switch="seed|participants|harvested" data-state="on|off"
data-part="hero|nameplate|tabbar"
```

- 상태 머신 카피 금지 (시작/전환/종료/단계/개수)
- 카드 1계열 유지
- 팔레트·나이테·탭 3개(마당/거실/서재) 유지

---

## 하지 말 것

- 제품 React/Next 코드 작성
- 새 Primitive·새 테이블 제안 확정
- CoreHub 내부 로직 수정
- 클로3 구현 대기 없이 문서만 양산

---

## 완료 조건

- [ ] Phase A 우선 화면 목업이 Handoff §3 매핑표와 대응됨
- [ ] data-* 힌트가 주요 블록에 붙어 있음
- [ ] 클로3에게 **HTML 소스만** 전달 가능 상태

---

## 전달 방법

함장 또는 PM에게 목업 경로/파일명 목록만 알린다.  
클로3 작업 지시서(`WORK_ORDER_clo3_PhaseA.md`)와 같은 Handoff 문서를 공유한다.

_PM: Grok_
