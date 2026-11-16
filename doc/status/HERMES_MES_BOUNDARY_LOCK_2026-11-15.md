# Status — Hermes ↔ 메스 경계 잠금: 조사/수정 분리 (2026-11-15)

_작성: 메스 (Hermes Agent) · 결정: 사람 (2026-11-15)_
_전제: ADR-HERMES-000 Active · Phase 0 Complete · Phase 1 Plan(2026-10-23) · 이름 구분(2026-11-14)_

## 왜 이 문서가 필요한가

Phase 1 Plan(2026-10-23)은 **A(앱 안의 판단·제안 모듈)만** 다룬다.
2026-11-14 이름 구분에서 **B(메스 = 이 PC에서 실제로 도는 실행 도구)** 가 분리되었지만,
**B의 경계는 어느 문서에도 없었다.** 하준아이가 B를 도구로 쓰는 구조를 붙이기 전에 그 선을 잠근다.

## 잠근 결정 (사람 확정 2026-11-15)

| | 내용 |
|---|---|
| **조사 (읽기)** | **하준아이가 자동으로 메스에게 전달한다.** 사람 승인 없이 |
| **수정 (쓰기)** | **사람 승인 뒤에만.** 파일·DB를 바꾸는 일 |
| **착수 시점** | **통합작업(하준아이 + CoreHub + CoreNull + CoreRing) 종료 이후.** 그 전에는 손대지 않는다 |

## 정의 (이 문서가 정한 것)

- **"실행"은 DB·파일을 바꾸는 것(write)을 뜻한다.** 조사(읽기)는 실행이 아니다.
  → 그래서 `실행 = 사람 승인 후`(ADR-CONFIRM-000 정렬)와 `조사는 자동`은 충돌하지 않는다.
- **A의 경계는 그대로다.** A는 판단·제안만 한다 (Phase 1 Out 유지 — 자동 실행·write 금지).
  이번에 바뀌는 것은 **B(메스)** 이고, B를 부르는 주체는 A가 아니라 **하준아이(사람 앞의 판단 주체)** 다.
- **자동 승인과 자동 조사는 다르다.** Phase 1 Out이 금지한 것은 *자동 승인 / 타임아웃 후 자동 실행*이다. 조사 전달은 그 목록에 없다.

## 잠근 결정 2 — 메스 작업 결과의 표기 (사람 확정 2026-11-15)

메스가 낸 작업 결과는 **기존 메시지 원본에 그대로 실린다.** 새 테이블·새 타입·화이트리스트 변경 없음.

| 필드 | 값 | 이유 |
|---|---|---|
| `author_type` | `'ai'` (그대로) | `validAuthors = ['human','ai']` (`lib/hajunApiPost.ts:200`) — 검증 변경 0 |
| `author_name` | `'메스'` | 작업 출처를 남긴다. `'HajunAI'` 로 접으면 메스의 작업이 하준아이의 말로 둔갑한다 |
| `msg_type` | `'work_result'` | 이미 화이트리스트에 있다 (`lib/hajunApiPost.ts:201`) |

**근거 — 이 표기면 결과 반환 경로가 이미 성립한다.**
방 기록은 하준아이의 답변 프롬프트에 `[author_name/msg_type] 내용` 형식으로 들어간다 (`ai_respond`, `lib/hajunApiPost.ts:244-258`). 그래서 메스의 결과를 위 표기로 남기면 하준아이의 다음 답변 맥락에

```
[메스/work_result] …
```

로 자동 포함된다. 즉 **메스 → 하준아이 결과 반환에는 새 배관이 필요 없다.** 같은 이유로 `author_name` 을 `'HajunAI'` 로 접으면 하준아이가 자기 작업을 자기 말로 읽게 된다.

부수: 승인·수정 지시도 같은 흐름에서 `decision`·`issue`·`question`·`answer` 로 실린다 — 어느 타입을 어느 단계에 쓸지는 착수 때 정한다.

## 실측한 사슬 (2026-11-15 · 로컬)

| 단계 | 상태 | 근거 |
|---|---|---|
| 사람 → 앱 | ✅ | 앱이 곧 하준아이 두뇌의 몸 (Groq + `contexts` 참조) |
| 하준아이 판단 | ✅ | `lib/hajunApiPost.ts:299-303` `evaluateHermesRule` → `hasActionUnit` |
| **하준아이 → 메스 전달** | ❌ **빈 조각** | 판단이 문자열 힌트로만 붙는다 (`formatHermesHint`) |
| 메스 실행 | ✅ | `app/api/hermes/route.ts` → `lib/hermesClient.ts` (WS `127.0.0.1:9119`) |
| 결과 → 앱 화면 | ✅ | `app/chat/page.tsx:402` · 결과 블록 |
| 사람 트리거 (현행) | ✅ | `메스:` 접두어 (`page.tsx:333`), 도달할 때만 버튼 (`:207`, `:219`) |

**빈 조각은 하나다.** 그 자리는 `lib/hajunApiPost.ts`의 chat 분기 — 제안을 실제 호출로 잇는 곳.

## 제약 (실측)

1. **로컬 전용.** 배포본(Vercel)은 이 PC에 닿지 않는다 — 도달 실패 시 실행 버튼을 렌더하지 않는 것이 정상 동작이다.
2. **메스 세션은 브라우저에만 있다** (DB 아님, `page.tsx:53`). → 앱을 닫으면 하준아이↔메스 작업선이 끊긴다. 이어가기는 같은 브라우저 한정.
3. **메스 한 턴 12~57초** (모델 의존, 최대 5분). 동기 대기면 하준아이 답변이 그동안 막힌다 → 결과는 별도 말풍선(비동기) 권장.
4. **비대화형 호출은 승인 필요한 명령에서 멈춘다.** "수정은 승인 뒤"가 기술적으로도 강제된다.
5. 조사는 읽기 전용이어야 한다 — **메스는 `contexts`를 읽기만** (Owner = HajunAI, `Agent_Repo_Mapping`: 하나의 데이터에는 하나의 Owner만).

## In (착수 시 할 것)

- 하준아이 판단 → 메스 조사 요청 자동 전달 (`hajunApiPost.ts` chat 분기)
- 결과를 앱 화면에 비동기로 붙이기
- 수정이 필요한 요청은 승인 게이트를 지나게 (Hermes 승인 게이트 재사용)

## Out (이 잠금에서 하지 않음)

- A에 자동 실행을 붙이는 것 (Phase 1 Out 유지)
- 메스가 `contexts`·Core 데이터를 **쓰는** 것
- 승인 없이 파일·DB를 바꾸는 모든 경로
- 하준아이↔메스 작업 기록을 별도 저장소 없이 브라우저에만 두는 것 (2번 제약의 해소 없이 착수 금지)
- 통합작업 중 착수

## 실측 — 열린 것 3개에 대한 답 (2026-11-15 추가 조사)

| 열린 것 | 실측 결과 | 남은 것 |
|---|---|---|
| **작업 기록의 그릇** | **이미 있다.** 메시지 원본이 작업 결과를 실을 수 있다 — `post_message` 의 `msg_type` 화이트리스트에 **`work_result`** 가 있고 `decision`·`issue`·`question`·`answer` 도 함께 있다 (`lib/hajunApiPost.ts:201`). 별도 승인 테이블 없이 기존 메시지·View 흐름을 쓴다는 원칙과 일치 | **작성자 표기 하나.** `author_type` 화이트리스트는 `['human','ai']` 이고 `ai` 메시지는 `author_name: 'HajunAI'` 로 저장된다 (`:162`, `:268`, `:530`). → **잠금 완료** (`잠근 결정 2`: `ai` + `author_name:'메스'` + `work_result`) |
| **앱이 `session.create` 에 `profile` 을 넘길지** | **자리가 이미 있고 값만 비어 있다** — `lib/hermesClient.ts:243`, `:260` 이 `profile: ''` 로 하드코딩 | 값을 어디서 받을지 (설정/요청) |
| **정본 문서 참조** | **앱에 엔드포인트가 이미 있다** — `GET /api/docs?agent=<이름>`. 실측: `200` / `14,068 bytes` / 실문서 3건. 등록된 에이전트는 `claude2`·`clo2`·`clo3`·`pm` 뿐이고 **메스는 미등록** (`app/api/docs/route.ts` `AGENT_DOCS`) | `AGENT_DOCS` 한 줄 + 정본 `doc/contexts/` 문서 |

부수 실측:

- `context_package` 는 **폐기**되었고 `GET /api/docs?agent=…` 로 안내한다 (`lib/hajunApiGet.ts:261`).
- 기억 참조 계약: `contexts?order=updated_at.desc&limit=1&select=understanding,last_synthesized_at,knowledge_unit_ids` (`lib/synthesizeUnderstanding.ts:16`).
- 읽기 표면(GET): `yard_list` `product_candidates` `product_random` `product_timeline` `listing_queue` `listing_timeline` `room_list` `view_room` `view_livingroom` `view_yard` `contexts` `dev_contexts` `snapshots` `sync_snapshot`
- 쓰기 표면(POST): `post_message` `ai_respond` `update_context` `chat` `synthesize_context` `summarize_context` `suggest_listing_title`
- **메스는 저장 경로에 한 곳도 없다** — UI·주석에만 등장. 세션은 브라우저 보관(위 제약 2번).

## 열린 것 (미정)

| 항목 | 상태 |
|---|---|
| 앱이 `profile` 값을 어디서 받을지 | 미정 — 자리는 있고 값만 비어 있음 |
| 메스를 `AGENT_DOCS` 에 등록할지 | 미정 — 엔드포인트·문서 경로는 준비됨 |
| 승인 이력 위치 | 미정 (Phase 1 Plan §5-3과 같은 열린 질문) |

## 채우는 방법 (착수 시 · 비용 순)

1. **(가)** 메스가 같은 DB를 직접 읽는다 — 앱 코드 변경 0. 오늘 이미 검증된 경로
2. **(다)** 앱의 `/api/hajun?action=…`을 HTTP로 부른다 — 앱이 떠 있어야 함
3. **(나)** MCP / Hermes 플러그인으로 감싸 메스에 도구로 등록 — 도구 이름이 안정적

## 두 구동의 분리 (사람 + 메스 / 하준아이 + 메스)

| | 공유 | 섞지 않음 |
|---|---|---|
| 기억 (`contexts`) | ✅ 참조 공유 | — |
| 작업 기록 | ❌ | ⚠️ 같은 통을 쓰면 두 맥락이 오염된다 |

Hermes에 이미 있는 그릇: 세션(`state.db`)은 프로필별, kanban은 프로필 간 공유 보드.

## 문서 위치

- ADR: `doc/adr/ADR-HERMES-000.md` (개정 없음)
- Phase 1 Plan: `doc/status/HERMES_PHASE1_PLAN_2026-10-23.md` (A 경계 · 이 문서가 개정하지 않음)
- 이름 구분: `doc/status/HERMES_NAME_DISAMBIGUATION_2026-11-14.md`
- 구현 레포: `sykim-stack/hajuncore-app` **main**

## 한 줄

**조사는 하준아이가 자동으로 메스에게 넘기고, 수정은 사람 승인 뒤에만. A의 경계는 그대로, 바뀌는 것은 B다.**
