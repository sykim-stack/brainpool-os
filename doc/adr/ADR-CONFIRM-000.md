# ADR-CONFIRM-000: adopted ≠ decision — AI 채택과 프로젝트 결정의 분리

**상태:** Active  
**작성일:** 2026-08-23  
**적용 범위:** HajunAI (hajun_posts), Room Context Package, 향후 모든 다중 AI 취합 구조  
**관련 문서:** Master_Prompt_v2.0 §1 (Human First), HajunAI_공간_메시지_아키텍처_v1.0 §12 (Room Context Package)  
**이전 가칭:** ADR-K05 (번호 충돌로 폐기. 기존 ADR-K05는 CoreNull → HajunAI Derived Data / understanding synchronization 관련)

---

## 1. 배경

dev_chat action은 여러 AI(Llama, Nemotron, Codestral, 관제 하준아이)의 응답을 받아 Llama/Nemotron 중 랜덤 심사위원이 하나를 고른다. 이 결과는 `hajun_posts.adopted` 필드에 true로 저장된다.

Room Context Package 4단계(`buildRoomContextPackage`) 최초 구현에서, 이 `adopted=true` 레코드를 그대로 `prior_decisions`(이전 결정)라는 이름으로 다음 AI 라운드의 맥락에 주입했다.

실제 테스트에서 문제가 드러났다: 심사위원이 채택한 답변 중 하나가 `db.ping()`처럼 프로젝트에 존재하지 않는 코드와 실재 여부가 불명확한 정책명을 그렇듯하게 섞어 만든 내용이었다. 이 응답이 "결정사항"이라는 이름으로 다음 AI들에게 주입될 빨했다.

---

## 2. 문제의 본질

이름을 잘못 붙인 문제가 아니라, **계층을 분리하지 않은 문제**다.

```text
AI 응답들 (Llama, Nemotron, Codestral, ...)
        ↓
   심사 / 선택 (AI가 AI를 심사)
        ↓
   adopted = 이번 라운드에서 선택된 답
        ↓
   ───────────────── (이 경계가 지금까지 없었다)
        ↓
   사람 검토
        ↓
   confirmed_by_human = 프로젝트가 실제로 채택한 결정
```

`adopted`는 AI 심사위원의 판단이다. 심사위원도 같은 모델군(Llama/Nemotron)이라 헐루시네이션에서 자유롭지 않다. 이걸 검증 절차 없이 "결정"으로 승격시키면, AI가 서로의 환각을 프로젝트 역사로 학습하는 오염 루프가 발생한다. 라운드를 반복할수록 오염이 누적된다.

---

## 3. 결정

`hajun_posts`에 사람 승인 레이어를 스키마로 분리한다.

| 필드 | 의미 | 채워지는 방식 |
|------|------|---------------|
| `adopted` | 이번 AI 라운드에서 심사 AI가 선택한 답 | **기존 필드** (변경 없음). 자동 (devAiPanel.ts 기존 로직 유지) |
| `confirmed_by_human` | 사람이 검토하고 프로젝트 결정으로 확정 | **신규 필드**. 수동, 기본값 false (확정 API는 아직 없음) |

Room Context Package가 노출하는 필드도 동일하게 분리한다.

| 필드 | 원본 | 의미 |
|------|------|------|
| `prior_adopted_answers` | `adopted=true` | AI가 과거 라운드에서 뽑았던 답의 참고 기록. **검증된 사실 아님.** |
| `prior_decisions` | `confirmed_by_human=true` | 사람이 실제로 확정한 프로젝트 결정. |

**`adopted`를 `prior_decisions`로 자동 승격하는 로직은 금지한다.**

---

## 4. 원칙

> **AI가 선택한 답은 AI의 기억이고, 사람이 확정한 답만 프로젝트의 결정이다.**

이 원칙은 Room Context 구조(`room` / `recent_messages` / `prior_decisions` / `participants`) 보다 상위에서 관리된다. 향후 어떤 다중 AI 취합 구조를 새로 만들더라도, AI 심사 결과를 사람 확인 없이 "결정"이나 "사실"이라는 이름으로 다음 AI 컨텍스트에 주입해서는 안 된다.

이는 Master_Prompt_v2.0의 Human First 원칙("AI는 분석하고 지원하며, 최종 결정은 사람이 한다")의 구체적 적용이다.

---

## 5. 적용 범위 및 제외

- 이번 결정으로 `hajun_posts`에 `confirmed_by_human`, `confirmed_at`, `confirmed_by` 컬럼을 추가했다 (마이그레이션: `20260823_hajun_posts_confirmed_by_human.sql`).
- `confirmed_by_human`을 true로 바꾸는 API/UI는 이번 범위에 포함하지 않는다. 지금은 스키마 레벨의 경계만 확정한다. 실제 확정 절차(누가, 어떤 화면에서, 어떤 기준으로 확정하는지)는 필요해지는 시점에 별도로 설계한다.
- 자동 검증(2차 AI 채점, 규칙 기반 검증 등)으로 `adopted`의 신뢰도를 높이는 방안은 이번 결정의 대상이 아니다. 검증 AI도 틀릴 수 있다는 전제 위에서, 이 ADR은 "자동 검증을 더 정교하게 만들는 것"이 아니라 **"사람 확인 없이는 결정으로 부르지 않는다"**는 경계를 세우는 것이다. 자동 검증은 `adopted`를 더 신뢰할 만하게 만들 수는 있어도, `confirmed_by_human`을 대체할 수 없다.

---

## 6. 예외 정책

Master_Prompt_v2.0 §6에 따라, 이 원칙에 대한 예외는 ADR 기록·영향도 분석·Decision Owner 승인을 모두 거쳐야 하며, 예외가 새로운 기본 원칙이 될 수 없다.
