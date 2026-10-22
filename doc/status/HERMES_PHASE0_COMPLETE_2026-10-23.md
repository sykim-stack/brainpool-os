# Status — Hermes Phase 0 완료 (2026-10-23)

_PM: Grok_  
_범위: HajunAI chat · Action Unit 판단·제안 (실행 금지)_

## 오늘 닫은 것

1. **규칙 함수** — `hajuncore-app` `lib/hermesRule.ts`  
   - Action Unit = 변화 ∧ 필요 ∧ 방향 (3조건 모두)  
   - 후보 5개만: 이해갱신 / 남김 / 확인질문 / 연결 / 보류  
   - `detectChange` = 신호만 (길이 기반 AU 제거 → 날씨 FP 해소)

2. **chat wire** — `lib/hajunApiPost.ts` `action=chat`  
   - LLM 직전 `evaluateHermesRule` → `formatHermesHint`를 systemPrompt에 주입  
   - 응답에 `hermes: { hasActionUnit, candidates, primary }` 반환  
   - 실행·자동 남김·이해 변경 경로 없음

3. **회귀 테스트** — `tests/hermesRule.test.mjs` + `npm run test:hermes`  
   - ADR 기준 5문장 + 날씨 false-positive = 6 cases  
   - 규칙 함수만 호출 (chat API / DB 미접근)  
   - main: `a832034` / `aa188cb`

4. **Production 검증** — `https://hajuncore-app.vercel.app/api/hajun?action=chat`  
   - 동일 6케이스 전부 일치  
   - 응답 키: `reply` · `observations` · `hermes` · `traceId` 만  
   - 실행 관련 키 없음

## 수용 기준 (Production 실측)

| 발화 | hasActionUnit | candidates (요지) |
|------|---------------|-------------------|
| 안녕 | false | 보류 |
| 이건 중요해 | true | 이해갱신, 확인질문 |
| 전에 말한 것과 달라 | true | 이해갱신, 연결, 확인질문 |
| 이건 기록해줘 | true | 남김 |
| 잘 모르겠어 | true | 확인질문, 보류 |
| 오늘 날씨 좋다 | false | 보류 |

## 의도적 미구현 (Phase 0 Out)

- 실제 실행 / 자동 승인 / 자율 행동
- 후보 확장, 패턴화, 스킬화
- 상품 마당 Hermes 적용

## 브랜치

- Hermes 진실 공급원 = **`hajuncore-app` `main`** (default)  
- `master` 는 별 계열 — Hermes 역이식 하지 않음

## 문서

- ADR: `doc/adr/ADR-HERMES-000.md`
- 경계 잠금: `doc/status/HERMES_PHASE0_BOUNDARY_LOCK_2026-10-09.md`
- 본 문서: Phase 0 구현·검증 완료 기록

## 다음 후보 (우선순위 아님)

- Phase 1 범위 논의 (실행 금지 전제 유지 여부 포함)
- UI에 `hermes` 힌트 노출 여부 (지금은 Network/API만)
- `package.json` `