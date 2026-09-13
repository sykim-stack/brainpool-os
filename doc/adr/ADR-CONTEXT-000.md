# ADR-CONTEXT-000 — contexts 소유권 (이해 상태)

_상태: Active_  
_결정일: 2026-09-13_  
_관련: HajunAI · Message-centric · ADR-CONFIRM-000_

## 결정 (한 문장)

**원본은 Core가 남기고, 이해는 HajunAI가 만든다. `contexts`는 그 이해의 현재 상태다.**

## 왜

- `contexts.understanding`에 Core들이 직접 쓰면 여러 주체가 하나의 이해 상태를 동시에 관리하게 된다.
- 원본 사건은 이미 Message / Knowledge Unit에 존재한다.
- BRAINPOOL Single Source of Truth + Message-centric과 맞춘다.

## 소유권

| 계층 | 주체 | 역할 |
|------|------|------|
| Message / Knowledge Unit | Core | 원본 (관찰·결정·기록의 사건) |
| `contexts.understanding` | HajunAI | 원본을 읽어 만든 **현재 이해** |
| `last_synthesized_at` | HajunAI | 종합 시점 |
| Self Context | (미구현) | 필요해지는 시점에만 도입 |

사용자는 `contexts`를 직접 관리하지 않는다. Core에서 행동한 결과가 원본으로 남고, HajunAI가 이를 읽어 이해를 만든다.

## 흐름

```text
Core
 ↓
의미 있는 사건 (Message / Knowledge Unit)
 ↓
HajunAI가 읽음 (synthesize)
 ↓
contexts.understanding + last_synthesized_at
 ↓
다음 대화(chat 등)에 재사용
```

목적이 `contexts`를 채우는 것이 아니라, **원본 축적 → 이해 → 재사용** 고리를 만드는 것이다.

## MVP (2026-09-13 구현 확인)

1. 관찰 원본 = 기존 Message / Knowledge Unit (+ 관제·개발·브라이언풀 마당의 의미 있는 msg_type)
2. HajunAI `synthesize_context` → `contexts.understanding` 생성
3. `last_synthesized_at` 기록
4. chat 시스템 프롬프트에 이해 주입

첫 트리거 원칙: 새 관찰 시스템을 만들지 않고, 이미 쌓이는 의미 있는 KU/마당 메시지를 처음으로 이해하기 시작한다.

## 하지 않음

- Core가 `contexts.understanding`에 직접 쓰기
- Self Context 선행 구축
- 상품등록 마당을 종합 원본에 포함 (별도 계약)

## 구현 위치 (hajuncore-app)

- `lib/synthesizeUnderstanding.ts` — 종합
- `lib/hajunApiPost.ts` — `action=synthesize_context`, `action=chat` 주입
- chat LLM 우선순위: NVIDIA → Groq → Gemini (관제·개발과 NVIDIA 정렬)

## 검증 (2026-09-13)

- synthesize: KU + yard_message_ids 반영, `last_synthesized_at` non-null
- contexts GET: understanding 존재
- chat: reply 생성, 이해 기반 상태 서술 확인
