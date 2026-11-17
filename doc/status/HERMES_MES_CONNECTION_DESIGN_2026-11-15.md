# 설계 — 하준아이 ↔ 메스 연결 (2026-11-15)
> **상태 조회 기준**: [STATUS_INDEX.md](./STATUS_INDEX.md) — 현재 상태는 이 문서 1곳만 본다.

_작성: 메스 (Hermes Agent) · 상태: **설계 (트리거 확정 · 착수는 통합작업 이후)**_
_전제: `HERMES_MES_BOUNDARY_LOCK_2026-11-15` — 잠근 결정 1(조사=자동 / 수정=승인 후) · 잠근 결정 2(결과 표기) · **잠근 결정 3(호출 판단=하준아이, 실행 권한은 분리)**_

> 이 문서는 **기술 매핑**만 담는다. 경계와 원칙의 정본은 경계 잠금 문서다 — 결정 문구·안전 경계·주입 방어를 여기에 중복해 적지 않는다.

## 0. 한 문장

하준아이가 판단해 메스를 부르고, 메스가 실행해 **기존 메시지 원본에 `[메스/work_result]` 로 남기면** 하준아이가 다음 판단에서 그 결과를 읽는다 — 새 테이블도, 새 판단 주체도 만들지 않는다.

## 1. 두 방향의 현재 상태

| 방향 | 상태 | 근거 |
|---|---|---|
| **메스 → 하준아이** | **성립** (배관 재사용) | 방 기록이 `ai_respond` 프롬프트에 `[author_name/msg_type] 내용` 형식으로 들어간다 (`lib/hajunApiPost.ts:244-258`) |
| **하준아이 → 메스** | **미착수** | chat 분기가 판단만 하고 호출하지 않는다 — `evaluateHermesRule` → `formatHermesHint` 문자열 힌트만 붙는다 (`:299-303`) |

## 2. 이미 있는 것 (새로 만들 부품이 없다)

| 부품 | 위치 | 상태 |
|---|---|---|
| 실행 브리지 | `app/api/hermes/route.ts` → `lib/hermesClient.ts` (JSON-RPC over WS `127.0.0.1:9119`) | 동작 (로컬 검증됨) |
| 브리지 계약 | `POST {prompt, session_id?, cwd?, timeout_ms?, source?}` → `{payload:{session_id, stored_session_id, text, status, usage, events, duration_ms}}` · 오류는 `{_error}` + **status 200** | 코드 주석에 문서화 (`throw 금지 · _error · 200만`) |
| 경계 문장 | *"Hermes 실패(미실행·시간 초과·승인 대기)도 200 + `_error` 로 돌려준다 — **판단은 하준아이와 사람이 한다**"* | `app/api/hermes/route.ts:12-14` |
| 대화 이어가기 | 런타임 id(소켓과 함께 소멸, orphan reaper 20초) ≠ STORED id → 재개는 `session.resume {session_id: STORED}` → 새 런타임 id → `prompt.submit` | `lib/hermesClient.ts:19-23` |
| 작업 전용 모델 | `HERMES_SESSION_MODEL=kilo-auto/free` / `HERMES_SESSION_PROVIDER=kilocode` — **사용자 데스크톱 모델을 건드리지 않는다** | `lib/hermesClient.ts:31-38` |
| 판단·제안 | `evaluateHermesRule` → 후보 5개 (`hasActionUnit`/`candidates`/`primary`) | Phase 0 잠금 |
| 결과 기록 자리 | 메시지 원본 + `msg_type:'work_result'` · `author_name:'메스'` | 잠근 결정 2 |
| 정본 문서 공급 | `GET /api/docs?agent=<이름>` (메스는 미등록) | 실측 200 / 실문서 |
| 메시지 `metadata` | 임의 객체를 그대로 저장한다 — `isProductMetadata` 는 이름과 달리 "평범한 객체인가"만 검사한다(배열만 거름) | `lib/hajunApiCore.ts:87-89` · 저장 `lib/hajunApiPost.ts:206-210` |
| 이해 합성 입력 | `work_result` 를 `hajun_messages` 에서 읽어 랭킹(가중치 1) → `contexts.understanding` 재료로 쓴다 | `lib/synthesizeUnderstanding.ts:94-99`, `:166-176` |

## 3. 설계 — 하준아이 → 메스

### 3.1 경로 (사람 경로는 그대로, 자동 경로를 서버에 하나 더)

```
[현행 · 사람]  브라우저 chat ──POST──> /api/hermes ──> hermesRun ──> WS 9119
               (「메스:」 접두어 또는 「메스에게 실행」 버튼)

[신규 · 자동]  chat 분기 (서버, lib/hajunApiPost.ts)
                ① 하준아이 판단 → need_work 요청 후보 (2단계)
                ② 실행 경로가 허용 범위 확인 (3단계) — read 만 자동
                ③ hermesRun 을 직접 import 해서 호출 (HTTP 홉 없음 — 같은 프로세스)
                ④ 결과를 post_message{author_type:'ai', author_name:'메스', msg_type:'work_result'} 로 남긴다
                ⑤ 같은 응답에 결과를 함께 돌리거나(동기) 말풍선으로 뒤에 붙인다(비동기)
```

**자기 라우트를 HTTP로 다시 부르지 않는다.** 자동 경로는 같은 프로세스에서 `lib/hermesClient.ts` 를 직접 쓴다. 라우트(`/api/hermes`)는 브라우저용 경계로 남긴다 — 사람 트리거는 즉시성이 필요하므로 지금처럼 클라이언트에 둔다.
(Next.js 경계 원칙: 클라이언트 잎이 도메인 호출을 갖지 않는다. 자동 경로를 서버에 두는 이유이기도 하다.)

### 3.2 트리거 — **확정** (경계는 `잠근 결정 3`)

| 후보 | 판정 |
|---|---|
| **(a) 모델 판단 + 실행 권한 분리** | **확정** — 하준아이가 `need_work` 요청 후보를 제시하고, 실행 경로가 허용 범위를 확인한 뒤에만 호출한다 |
| (b) 결정론 규칙 | 탈락 — 판단을 규칙으로 되돌리는 것이고, Phase 0 의 *후보 5개 확장 금지* 와도 부딪힌다 |
| (c) 사람 트리거 유지 | 탈락 — 자동이 아니게 되어 잠근 결정 1을 무효화한다 |

**이 설계가 구현하는 것:** 2단계(하준아이 후보 제시)와 3단계(실행 경로의 허용 확인)를 분리한다. **하준아이의 판단은 곧 호출 권한이 아니다.** 안전 경계 표 · 주입 방어 · 집행 지점은 `잠근 결정 3` 이 정본이다.

기술 매핑 — 하준아이 답변에 함께 받는 신호(초안):

```json
{"need_work": {"kind": "read", "ask": "<조사 지시 원문>"}}
```

`kind` 가 `read` 가 아니면 자동 호출하지 않고 사람 승인 대기로 넘긴다.

### 3.3 등급 — 조사/수정 분리 (잠근 결정 1 그대로)

| 등급 | 메스가 하는 일 | 승인 |
|---|---|---|
| **조사 (읽기)** | 파일·DB·배포본 읽기, 조사·검증 | **불필요** (자동 전달) |
| **수정 (쓰기)** | 파일 편집·커밋·DB write·설정 변경 | **사람 승인 후** |

요청문에 등급을 싣는다 (`kind: 'read' | 'write'`). 메스 쪽 승인 게이트가 2차 방어선이다 — 실측: 비대화형 호출은 `ask-approval` 에서 멈춘다(사람이 없으면 벽).

### 3.4 요청 규격 (초안)

```json
{
  "kind": "read",
  "ask": "<조사 지시 원문>",
  "cwd": "G:/hajuncore-app",
  "room_id": "<기록을 남길 방>",
  "trace_id": "tr-…"
}
```

브리지로는 현행 계약대로 `prompt` 하나만 넘긴다. 등급·방·trace 는 요청문과 메시지 기록에 남긴다(브리지 계약을 늘리지 않는다).

**자동 경로는 `cwd` 와 `timeout_ms` 를 명시한다** (`잠근 결정 4-3`: 상한 240초). `cwd` 는 메스가 그 폴더의 `AGENTS.md`·메모리·스킬을 함께 읽는다는 뜻이다(`lib/hermesClient.ts:55`). 비우면 기본값 600,000ms(10분)가 걸린다(`:27`). 현행 사람 경로는 둘 다 기본값을 쓴다(`app/chat/page.tsx:405`).

### 3.5 결과 반환 — 새 배관 없음 · **비동기** (`잠근 결정 4-2`)

메스 결과를 **메시지 원본에 남긴다**(잠근 결정 2). 그러면 **두 곳으로 들어간다**:

| | 경로 | 근거 |
|---|---|---|
| ① | 하준아이의 다음 답변 프롬프트 — `[메스/work_result] …` | `lib/hajunApiPost.ts:244-258` |
| ② | **하준아이의 이해 합성** — `contexts.understanding` 갱신 재료 | `lib/synthesizeUnderstanding.ts:94-99` 조회 · `:166-176` 가중치(`work_result`=1) · `:178-184` 블록에 `author_name` 포함 |

그래서 응답 본문에 결과를 실을 이유가 없다 — **하준아이 답변은 즉시, 메스 결과는 뒤에 메시지로 도착한다.**

**주의 — 이 자동 포함은 실행 권한이 아니다.** 결과 본문에 호출 지시가 들어 있어도 실행 경로를 거치지 않으면 실행되지 않는다(`잠근 결정 3` 주입 방어).

세션 이어가기의 STORED id 는 **메시지 `metadata` 에 남긴다**(`잠근 결정 4-1`) — 브라우저에만 두지 않으므로 앱을 닫아도 작업선이 살아남는다.

## 4. 미결정 (착수 전 정해야 하는 것)

| 항목 | 왜 필요한가 |
|---|---|
| `profile` 값 | `lib/hermesClient.ts:243,260` 이 `profile:''` — 채우면 세션 분리 |
| `AGENT_DOCS` 등록 | 메스가 정본 문서를 참조하는 경로 |
| 승인 이력 위치 | Phase 1 Plan §5-3 |

트리거는 `잠근 결정 3`, 세부값 셋(metadata 저장 · 비동기 · 240초)은 `잠근 결정 4` 로 **확정**됐다. 남은 셋은 전부 "이미 있는 자리 채우기"다.

## 5. 위험 · 실패 모드

| 위험 | 실측 근거 | 대응 |
|---|---|---|
| 배포본에서 동작하지 않는다 | 배포본 `reachable:false` → 실행 버튼 미렌더 | 로컬 전용임을 명시. 배포본에서는 조용히 비활성 |
| 승인 게이트에서 멈춘다 | 비대화형 호출은 `ask-approval` 에서 대기 | 조사만 자동, 수정은 사람 |
| 느린 턴 | 12~57초 (기본 상한 10분) | 자동 경로는 `timeout_ms` 를 짧게 + 비동기 반환 |
| **간접 주입** | 메스 결과가 하준아이 프롬프트에 들어간다 | 기록은 실행 권한이 아니다 — `잠근 결정 3` 주입 방어 |
| **무한 재귀** | 결과가 맥락에 들어가니 하준아이가 또 부를 수 있다 | 요청당 호출 1회 상한 (`잠근 결정 3` 집행 지점) |
| 두 AI 혼동 | — | `author_name:'메스'` 유지 (잠근 결정 2) |

## 6. 착수 순서 (통합작업 종료 이후)

1. `AGENT_DOCS` 에 메스 등록 + `doc/contexts/` 문서 — 앱 코드 1줄 + 정본 문서 1개
2. `profile` 값 채우기 (`lib/hermesClient.ts` 2곳)
3. 회귀: 기존 경로(사람 트리거 `메스:` / 버튼) 무손상 확인
4. 하준아이 → 메스 자동 경로 + 결과 기록 (§3.1)
5. 검증: 조사 1건이 `[메스/work_result]` 로 남고, **하준아이의 다음 답변이 그 결과를 인용하는가**

## 7. 착수 금지 (Out)

- A(앱 내 판단·제안 모듈)에 실행 권한을 주는 것
- **하준아이의 판단이 곧바로 호출이 되는 것** (실행 경로 확인 생략 — `잠근 결정 3` 위반)
- 메스가 `contexts`·Core 데이터를 **쓰는** 것
- 승인 없는 파일·DB 변경
- **메시지 본문을 실행 근거로 삼는 것** (주입)
- **새 승인 테이블·별도 큐 신설** — 기존 메시지 원본·View 로 충분하다
- 통합작업 중 착수

## 8. 검증 범위 (내가 실제로 연 코드)

| 확인함 (코드 직접 읽음) | 미확인 (착수 때 확인) |
|---|---|
| `app/api/hermes/route.ts` 전체(74줄) — 계약·오류 처리·`dynamic`/`runtime` 선언 | `lib/hermesClient.ts` 191~308줄 (이벤트 루프·`session.resume` 실제 호출부) |
| `lib/hermesClient.ts` 1~190줄 — 세션 토큰·health·`hermesRun` 골격·타임아웃 | 브리지가 승인 대기(`ask-approval`)를 실제로 어떻게 감지하는지 |
| `app/chat/page.tsx` 388~435줄 — 사람 트리거 호출부 | 앱 전체에서 `/api/hermes` 를 부르는 다른 곳이 있는지 |
| `lib/hajunApiPost.ts` chat 분기·`ai_respond` 프롬프트 조립 | `need_work` 신호를 Groq 응답에서 파싱하는 실제 난이도 |

## 문서 위치

- 경계 잠금: `doc/status/HERMES_MES_BOUNDARY_LOCK_2026-11-15.md`
- 이름 구분: `doc/status/HERMES_NAME_DISAMBIGUATION_2026-11-14.md`
- Phase 1 Plan: `doc/status/HERMES_PHASE1_PLAN_2026-10-23.md`
- 구현 레포: `sykim-stack/hajuncore-app` **main**

## 한 줄

**하준아이가 신호를 내고, 실행 경로가 허용을 확인해 메스를 부르고, 결과는 기존 메시지에 `[메스/work_result]` 로 남는다 — 배관은 재사용, 판단과 실행 권한은 분리. 남은 것은 착수와 세부값(동기/비동기 · 타임아웃 · 저장 위치)이다.**
