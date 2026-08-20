# HajunAI 공간·메시지 아키텍처 v1.0

## 문서 상태

| 항목 | 내용 |
| --- | --- |
| 문서 성격 | 하준AI 상위 설계·운영 기준 |
| 현재 상태 | 설계 초안 (구조 확정용 · 구현 전) |
| 핵심 범위 | 관제마당·개발마당·엔진방·의미 View·메시지 원본 |
| 구현 범위 | 구현 전 구조 확정 문서 |
| 최종 결정자 | 하준(함장) |
| 관련 | CoreNull Anchor, `HajunAI_AI_CoreNull_Philosophy_v1.0.md`, DevChat 지시서, ADR-NEIGHBOR-000 |
| 충돌 시 | **CoreNull Anchor** · Human First · 본 문서. 제품 일상 chat 계약을 대체하지 않는다. |

---

## 1. 문서 목적

이 문서는 하준AI의 두 핵심 기능인 **관제**와 **개발**을 하나의 공간 구조 안에서 정리한다. 하준AI는 단순한 대화창이나 특정 AI 모델의 인터페이스가 아니다. 하준AI는 브라이언풀의 메시지 세계를 읽고, 목적에 따라 서로 다른 공간 View를 제공하며, 필요한 방에 여러 AI가 참여하도록 연결하는 시스템이다.

> 하준AI에서 관제와 개발은 어떻게 분리되는가?  
> 엔진은 어떤 공간으로 표현되는가?  
> 메시지와 방·마당·AI·View는 어떤 관계를 가지는가?  
> AI에게 방의 맥락은 어떻게 전달되는가?

---

## 2. 핵심 정의

> **메시지가 세계의 원본이고, 공간은 그 세계를 바라보는 관점이다.**

브라이언풀에서 모든 콘텐츠는 메시지로 기록한다. 사용자의 질문, AI의 분석, 개발 결과, 관제의 검증, 사람의 결정, 오류, 작업 상태, 지식, 관찰, **생활 기록(Post)** 은 모두 메시지다.

마당·거실·방·프로젝트·엔진·AI는 메시지를 소유하는 콘텐츠가 아니다. 이들은 메시지와 관계를 맺거나, 메시지를 특정 목적에 따라 필터링·정렬·해석·표현하는 공간 및 View다.

```text
Message World
     │
     ├── 관제 View
     │    └── 관제마당 · 거실 · 의미방
     │
     └── 개발 View
          └── 개발마당 · 거실 · 엔진방
```

**CoreNull**이 다루는 생활 세계의 House / Room / Post / seed·fruit 스위치도, 하준AI 안에서는 **메시지·관계·View**로 읽고 개발·관제한다. CoreNull 제품 공간의 SoT·규칙은 Anchor가 이긴다.

---

## 3. 하준AI의 두 핵심 기능

| 구분 | 관제마당 | 개발마당 |
| --- | --- | --- |
| 핵심 질문 | BRAINPOOL에서 무엇이 일어나고 있는가? | 무엇을 만들고 있으며 무엇을 검증하는가? |
| 공간 기준 | 의미·현상·전체 맥락 | 엔진·책임 영역 |
| 주요 활동 | 관찰·해석·상태 이해·결정 후보 | 설계·구현·실험·오류 분석·테스트 |
| 최종 결정 | 사람 하준 | 사람 하준 |

### 3.1 관제마당

엔진 목록이 아니라, 여러 엔진 메시지로 **의미 있는 변화**를 바라보는 공간이다. 방은 축적 후 제안·승인으로 만든다.

```text
관제마당
├── 거실
├── 언어·의미
├── 대화·맥락
├── 이웃·연결
├── 생활·공간          ← CoreNull 축 (마당/거실/서재, seed·기록)
└── 이후 드러나는 의미 View
```

### 3.2 개발마당

엔진·책임 영역 기준. **AI 모델 이름 ≠ 방 이름.**

```text
개발마당
├── 거실
├── CoreNull          ← 생활 공간 · House/Room/Post · seed·fruit · UI·규칙
├── CoreChat
├── CoreRing
├── CoreHub
└── Hajun
```

---

## 4. 공간 계층

```text
하준AI 광장
├── 관제마당 (거실 · 의미 View)
└── 개발마당 (거실 · 엔진방)
```

관제마당 ← Neighbor → 개발마당 (ADR-NEIGHBOR-000: 관계 ≠ 자동 권한).

거실은 방 메시지 Projection. **복사 원본 금지.** 방은 메시지를 소유하지 않고 관계를 맺는다.

---

## 5. 개발마당의 엔진방

| 엔진방 | 엔진의 본질 | 주요 개발 메시지 |
| --- | --- | --- |
| **CoreNull** | **생활 공간 (Space / Life)** | House·Room·Post, 마당·거실·서재 View, seed/fruit **스위치**, 참여자, 생활 기록, 공간 UI·Access·규칙, Neighbor |
| CoreChat | 흐름과 상호작용 | 대화 흐름, 세션, 상호작용, 오류 |
| CoreRing | 언어와 의미 | 번역, 언어 지식, 의미 분석, 패턴 |
| CoreHub | 연결과 운영 | Core 간 연결, 전달, 취합, 통합 |
| Hajun | 이해와 판단 | Context, 기억, 상태, 관제, AI 협업 |

구현 전 책임 기준. 미확인 스키마·API는 Fact로 취급하지 않는다.

### 5.0 CoreNull 방 (필수)

CoreNull은 “부가 엔진”이 아니라 **사람이 사는 공간**의 엔진이다.

- **저장 원자:** Message + Room (Anchor). House는 Domain(1인 1집), UI 객체 아님.
- **스위치:** `seed_started_at` / `seed_target_date` / `has_participants` / `harvested` — 상태 머신 아님.
- **View:** 광장·마당·거실·서재 = 같은 데이터의 Scope. Master View + Block.
- **하지 않는 것:** 추천·번역·채팅 엔진 대체. 외형·진열·스위치만.

개발마당 CoreNull 방의 작업 메시지 예: Phase A Room Card/마당/거실, Adapter(`roomStage`), Neighbor, RingBlock 표현 계약, Access 정책.

### 5.1–5.4

- **CoreChat:** 대화·상호작용 흐름
- **CoreRing:** 언어·의미·번역·패턴
- **CoreHub:** Core 간 연결·전달·취합
- **Hajun:** 이해·기억·Context·관제 보조

---

## 6. 관제마당의 의미 View

| 의미 View | 관련될 수 있는 엔진 |
| --- | --- |
| 언어·의미 | CoreRing, CoreChat, Hajun, CoreHub |
| 대화·맥락 | CoreChat, Hajun, CoreRing |
| 이웃·연결 | CoreNull, CoreHub, Hajun |
| **생활·공간** | **CoreNull** (마당/거실/서재, seed·기록, 공간 규칙), Hajun, CoreHub |
| 상태·기억 | Hajun, CoreHub, CoreNull 상태·스냅샷 메시지 |
| 이후 발견 | 축적 후 제안 |

관제 방은 AI가 임의 영구 생성하지 않는다. 제안 → 사람 승인 또는 명시 규칙.

---

## 7. 메시지 중심 원칙

1. **메시지 = SoT** (질문·분석·오류·결정·생활 Post 포함)
2. **View ≠ 콘텐츠** — 새 화면 전에 “새 메시지인가, 다른 View인가?”
3. **복사 금지** — 관계·View·상태로 연결

CoreNull 생활 Post와 하준AI 개발/관제 메시지는 목적이 다를 수 있으나, **복제 SoT를 만들지 않는다.** Ownership은 Core별 유지 (CoreNull 테이블에 Hajun이 함부로 write하지 않음).

---

## 8. 방 Context

Room Context Package = 방 정체성·책임·ADR·최근 작업·오류·질문 메시지 집합.

- 참여 AI: 동일 작업 Context
- 관제 하준AI: 작업 + 필요 범위의 전체 맥락
- MindWorld 전체 무제한 주입 금지

CoreNull 방 Context에는 Anchor·ROADMAP·관련 ADR(NEIGHBOR, SEED-ADAPTER, RINGBLOCK, ACCESS) 기준 메시지를 우선한다.

---

## 9. AI 참여 구조

AI = 방 소유자 아님 · 메시지 작성 참여자. 모델 교체 ≠ 방 소멸.

**관제 하준AI ≠ 랜덤 Judge.** 충돌·위험·사람 결정 항목 정리. 최종 = 하준.

---

## 10. 메시지 흐름

```text
개발마당 엔진방 (CoreNull 포함)
  → 개발 Context
  → 관제 의미 View (생활·공간 등)
  → 관제 검증
  → 하준 결정
```

---

## 11. 정보 확실성 규칙

Fact / Inference / Hypothesis / Verification Pending / Tentative Proposal / Human Decision.  
미확인 테이블·API·Core 책임을 사실처럼 구현하지 않는다.

---

## 12. 개발 단계 최소 흐름

1. 관제마당 · 개발마당 구분
2. 거실: 방 목록·최신 메시지
3. 개발마당 엔진방: **CoreNull** · CoreChat · CoreRing · CoreHub · Hajun
4. Room Context Package
5. 참여 AI 동일 Context → 원본 결과 메시지
6. 관제 검증 → 사람 결정 메시지

의미 View는 축적 후 필요한 것부터.

---

## 13. 구현 전 확인

레포·커밋·메시지 원본·방/마당 구조·Core 책임·Context 경로·AI 저장·UI.  
승인 전 SoT·권한 임의 변경 금지.

---

## 14. 최종 정의

> **하준AI는 메시지를 원본으로 하는 공간형 지능 시스템이다.**  
> 개발마당은 **CoreNull(생활 공간)** · CoreChat · CoreRing · CoreHub · Hajun 엔진 책임 기준.  
> 관제마당은 엔진 이름이 아니라 언어·의미·대화·맥락·이웃·**생활·공간** 등 의미 기준.  
> 두 마당은 Neighbor. 거실은 Projection. 방은 소유가 아니라 관계.  
> AI는 참여해 메시지를 남기고, 관제 하준AI는 검증하며, 하준이 최종 결정한다.

CoreNull 제품 규칙(Anchor: Message+Room, 스위치, View)을 하준AI 개발·관제가 **우회하거나 재정의하지 않는다.**

---

## 부록 A. 핵심 용어 (발췌)

| 용어 | 정의 |
| --- | --- |
| CoreNull 엔진방 | 생활 공간·House/Room/Post·seed 스위치·공간 UI·규칙 개발 메시지의 방 |
| 생활·공간 View | 관제에서 CoreNull 축 현상(마당/기록/이웃 등)을 보는 의미 View |
| Message / View / 방 / Neighbor | §2·§4·ADR-NEIGHBOR-000과 동일 |

## 부록 B. 구현하지 말아야 할 오해

```text
AI 이름으로 방을 만들지 않는다.
개발마당에서 CoreNull을 빼지 않는다.
방이 메시지를 소유한다고 가정하지 않는다.
거실에 복사 원본을 만들지 않는다.
관제를 랜덤 Judge로 두지 않는다.
CoreNull Anchor(스위치·Message SoT)를 하준AI가 재정의하지 않는다.
확인되지 않은 DB·API를 사실처럼 구현하지 않는다.
AI 결과를 사람 결정으로 승격하지 않는다.
```

## 부록 C. 시작 질문

이 작업은 어떤 마당·엔진(특히 CoreNull 여부)·의미 View인가? 새 메시지인가 View인가? Context·관제·사람 결정은?

---

## References

- CoreNull Anchor v1.2 · CORENULL_ROADMAP · UI Architecture Master View
- ADR-NEIGHBOR-000 · ADR-SEED-ADAPTER-000 · ADR-RINGBLOCK-000
- HajunAI_AI_CoreNull_Philosophy · DevChat Control Directive
- [brainpool-corenull](https://github.com/sykim-stack/brainpool-corenull) · [brainpool-os](https://github.com/sykim-stack/brainpool-os)

---

*초안: Manus AI · 방향: 하준*  
*PM: Grok — 2026-08-20 등록 / **CoreNull 엔진방·생활·공간 View 보완***
