# ADR-RINGBLOCK-000: RingBlock 표현 계약

**기준일:** 2026-08-20  
**상태:** Draft — Phase 0  
**대상:** 클로3 (CoreNull), 클로4 (CoreHub)  
**대상 컴포넌트:** RingBlock (나이테)  
**상위:** CoreNull_Core_Principles (Anchor), CORENULL_ROADMAP, CoreNull_UI_Architecture (Master View + Block)  
**충돌 시:** Anchor가 이긴다.

---

## 0. 이 문서가 결정하지 않는 것

- 나이테의 구체적 시각 디자인 (SVG 구조, 색상, 애니메이션)
- 현재 House 정적 데이터로 나이테를 계산하는 **공식**
- CoreHub가 나중에 붙일 가중치/추천 알고리즘의 **내용**

이 문서는 **RingBlock의 표현 구조가 데이터 계산 방식과 독립적**이어야 한다는 계약만 확정한다.

---

## 1. 배경

RingBlock(나이테)은 House(Domain)에 존재하는 시간·성장 데이터를 사용자가 시각적으로 경험하게 만드는 **Block**이다. 현재는 House 정적 데이터(경과일, 활동량)만으로 1차 가치가 성립하므로, 로드맵은 이미 “CoreHub는 RingBlock의 선행조건이 아니다”라고 판단했다 (Phase B · 보강 관계).

문제는 그 판단의 근거가 명시되어 있지 않았다는 것이다: CoreHub가 나중에 가중치·추천을 얹어도 RingBlock을 뜯어고치지 않아도 되는 **구조적 이유**가 무엇인가?

---

## 2. 결정

**RingBlock의 표현 계약과 데이터 계산 로직을 분리한다.**

```text
RingBlock(props: RingData) → 시각적 나이테

RingData = {
  rings: Array<{
    index: number
    weight: number   // 상대 굵기/강도. 의미는 RingBlock이 해석하지 않음
  }>
}
```

- **표현 계약(고정):** RingBlock은 `RingData`만 입력받아 나이테를 그린다. `rings` 각 항목이 “무엇을 의미하는지”는 RingBlock이 알 필요 없다. `weight`가 클수록 두껍게/진하게 그리는 것까지만 책임진다.
- **데이터 계산(가변):** `RingData`를 만드는 쪽(현재: House 정적 데이터 기반 함수, 미래: CoreHub 연동 함수)이 무엇을 근거로 `weight`를 계산하는지는 **RingBlock 바깥**의 문제다.

이렇게 하면:

- **지금:** House의 경과일/활동량으로 직접 `RingData`를 계산해 넘긴다.
- **CoreHub 연동 후:** 가중치 판단을 반영하는 **계산 함수만 교체**한다. RingBlock 컴포넌트·props 계약은 변경하지 않는다.

### 2.1 meta 필드

계약에 임의 `meta`를 두지 않는다.  
디버깅·로깅이 필요하면 계산 레이어/호출 측에서 처리하고, **RingBlock props로 비즈니스·네비게이션 의미를 넘기지 않는다.**

(구현상 일시 디버그 필드가 붙더라도 **렌더링·클릭·라우팅에 영향을 주면 계약 위반**이다.)

---

## 3. 근거

1. **로드맵 Phase B 판단 유지** — 나이테는 House 정적 데이터로 단순 계산 가능, CoreHub 연동은 선행조건이 아니라 보강. 이 문서는 그 판단이 성립하는 이유(표현/계산 분리)를 명시한다.

2. **View / Block은 렌더링 책임** — Anchor·UI Architecture: Block은 표시 조합이며, 가중치·추천 등 비즈니스 계산을 컴포넌트 안에 두지 않는다. 계산 출처가 바뀌어도 View는 동일 props로 동작해야 한다.

3. **Block Library와 일관성** — Display Policy와 Access Policy 분리, Content와 View 분리와 같은 패턴의 연장이다. RingBlock도 “그리는 쪽”과 “숫자를 만드는 쪽”을 나눈다.

---

## 4. Validation Check (Anchor)

1. Message 없이 존재하는가? → RingBlock은 View/Block이며 파생 시각화다. 새 콘텐츠 Primitive 아님.
2. 중복 로직인가? → 없음. CoreHub 연동 시 RingBlock 재구현 중복을 막기 위한 계약.
3. House(Container)에 비즈니스 로직이 들어가는가? → `weight` 계산은 House UI가 아니라 **별도 함수**(현재 정적 계산, 미래 CoreHub 클라이언트). RingBlock도 View만. 위반 아님.

---

## 5. 다음 단계 · 연동 완료 조건

1. 현재 정적 계산 함수는 구현 시 `lib/` 하위 **별도 모듈**에 둔다. RingBlock 컴포넌트 내부에 계산 로직을 넣지 않는다.
2. CoreHub 연동 시점이 오면, 아래를 **연동 작업 완료 조건**으로 삼는다:
   - 계산 함수만 교체되고 **RingBlock 컴포넌트 / `RingData` props 계약이 유지**되는가
   - **기존 사용자 나이테 표현이 급격히 단절되지 않는가** (링 개수·weight 분포의 급변으로 “다른 제품”처럼 보이지 않는지). 필요하면 스케일 정규화·상한·점진 반영 등은 **계산 레이어**에서 처리한다.

---

_PM 반영: Grok — 2026-08-20 (인용 정정 · meta 제거 · 시각 연속성)_
