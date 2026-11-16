# Core 연결 계약 — Fact / Connection Contract (v1.0)

| 항목 | 내용 |
| --- | --- |
| 문서 성격 | **Core 사이에 오가는 사실 이름(`fact_type`)과 payload 최소 계약** |
| 작성 | 메스 (Hermes Agent) · 2026-11-16 |
| 근거 | 코드 실측(4개 레포) + 라이브 집계(`/api/corehub/facts?limit=200`) |
| 계기 | 문서 수정 목록 **A-8** — "계약이 코드에만 있었다"(정본 문서 0건) |
| 관련 | `Master_Prompt_v2.0` §2(파이프라인) · `Agent_Repo_Mapping`(데이터 소유권) · `contexts/clo4.md`(CoreHub) |

> 이 문서는 **공개 사실 이름(payload 최소 필드)** 만 규정한다. 라우트 구현·스키마 내부 구조는 규정하지 않는다.

## 0. 판정 기준 (2026-11-16 사람 확정)

| 구분 | 판정 |
| :--- | :--- |
| **공개 계약** — `fact_type` 이름, 공개 엔드포인트 | **알아도 된다** (모르면 연결 자체가 불가) |
| **내부 구현** — 저장 스키마·테이블·컬럼, 남의 판단 규칙 | **금지** (상대가 바꾸면 조용히 깨진다) |
| **상대의 행동·문구 지정** — `action_type`, 표시 문구 | **금지** (상대 역할을 대신 정하는 것) |

## 1. 생산자 ↔ 사실 (라이브 실측 2026-11-16)

| 생산자 | `fact_type` | payload (허용 필드) | 라이브 건수 |
| :--- | :--- | :--- | --: |
| **CoreNull** | `space.seed.created` | `house_id`, `room_id`, `message_id`, `run_id`, `outbox_id`, `idempotency_key` | 17 |
| **CoreNull** | `space.fruit.created` | `house_id`, `message_id`, `outbox_id`, `idempotency_key` | 12 |
| **CoreNull** | `space.fruit.harvested` | `house_id`, `message_id`, `outbox_id`, `idempotency_key` | 1 |
| **CoreNull** | `space.message.created` | `house_id`, `room_id`, `message_id`, `outbox_id`, `idempotency_key` | 5 |
| **CoreRing** | `language.translated` | `device_id`, `direction`, `tb_trans_log_id`, `message_id`, `owner_key_source`, `trace_id` | 58 |
| **CoreRing** | `relation.chat.sent` | `room_id`, `device_id`, `message_id`, `tb_trans_log_id`, `trace_id` | 26 |
| **(예정) HajunAI** | `mind.understanding.*` | 미정 — **ADR 대상, 미착수** | 0 |

**코드 출처**: CoreNull `app/api/corenull/posts/route.js`·`rooms/route.js`·`lib/seedPeriod.js` / CoreRing `app/api/brainpool/route.ts`·`app/api/chat/route.ts` (호출부 전수 2곳)

### 1.1 payload 규칙

- **식별자 + 파생값만.** 원문·번역문 텍스트(`source_text`·`standard_vi`·`content`)는 **싣지 않는다** (복제 금지).
- `message_id` + `message_source`는 **참조**이며 소유권·데이터 통합을 의미하지 않는다 (2026-11-16 사람 확정).
- 생산자는 자기 사실 이름만 선언한다. 남의 사실 이름으로 보내지 않는다.

## 2. Hub 연결 규칙 (Hub 내부 — 소비자는 알 필요 없음)

```
fact → patterns(연결) → connections → meaning_map(의미) → opportunities(제안) → 소비자 pull
```

| 연결(`connection_type`) | 조건 | 의미(`meaning_type`) | 제안(`opportunity_type`) | 우선순위 · 만료 |
| :--- | :--- | :--- | :--- | :--- |
| `seed.to.fruit.achieved` | `space.seed.created` **+** `space.fruit.created` | `goal.achieved` | `celebrate.achievement` | high · 72h |
| `cross.language.relationship` | `language.translated` **+** `relation.chat.sent` | `new.relationship.forming` | `suggest.translation.help` | medium · 48h |
| `seed.abandonment.risk` | `space.seed.created` **且** `space.room.visited` 없음 **且** `space.fruit.created` 없음 | `seed.at.risk` | `nudge.seed.owner` | high · 24h |

**A-4 (2026-11-16 확정)**: 제안은 **공통 1건**이며 Hub은 **소비자를 지정하지 않고 문구를 창작하지 않는다**(`action_type`·`payload.message` 제거). 각 Core가 자기 라벨을 붙인다.

**활동 로그**: `space.message.created`는 **어떤 패턴에도 참여하지 않는다**.

## 3. 위반·공백 실측 (2026-11-16)

| # | 관측 | 의미 |
| --: | :--- | :--- |
| 1 | 라이브에 `source=probe / fact_type=probe` **1건** | **계약 밖 생산자가 실제로 들어와 있다** — 무인증 POST로 `source`를 자기 주장할 수 있다(쓰기 경계 미비, A/B 대기) |
| 2 | 라이브에 `CoreRing / test.manual` **1건** | 테스트 사실이 운영 Hub에 남아 있다 |
| 3 | `space.room.visited` — **패턴이 참조하나 생산자 없음** | `seed.abandonment.risk` 연결은 **발화 불가** (미생산 타입) |

## 4. 신원 (`owner_key`)

- `owner_key`는 **Platform 사람 식별자**다. `device_id`를 `owner_key` 자리에 넣지 않는다.
- CoreRing은 `x-owner-key` 헤더 우선, 없으면 device 폴백이며 **payload에 `owner_key_source`로 표시**한다.
- Hub은 `owner_key` 스코프로만 조회하며, **쿼리로 `owner_key`를 넘기면 거부**한다(`owner_fields_not_accepted`).

## 5. 소비 (2026-11-16 확정)

- **소비는 조회다.** 소비자 → Hub 소비 처리(PATCH)는 **폐지** — `405 consume_not_supported`.
- `is_consumed`·`consumed_at` 컬럼은 **미사용 표기**(삭제는 한 단계 늦춤). 가시성은 **만료(`expires_at`)만** 본다.
- 소비자별 상태(읽었다/처리했다)는 **소비자 자기 공간**에 둔다.

## 6. 변경 절차

- `fact_type` 추가·변경·폐기는 **이 문서 갱신 + 생산자/소비자 합의**로 한다(계약이 코드에만 있으면 드리프트가 재발한다).
- 새 연결(데이터가 새로 흐르는 곳이 생기는 변경)은 **ADR** 대상이다.
