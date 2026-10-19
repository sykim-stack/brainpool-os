# ADR-PROPOSAL-001 — BRAINPOOL Proposal DB: 공통 제안·승인 공간

_상태: Proposed — 사람 승인 전_
_작성일: 2026-10-19_
_관련: Master_Prompt_v2.0 · Governance_Foundation_v1.0 · ADR-CONTEXT-000 · ADR-CONFIRM-000 · ADR-HERMES-000 · ADR-IDENTITY-OWNERSHIP-001_

## 1. 결정 요약

BRAINPOOL는 Core가 소유한 원본과 AI·Core가 생성한 제안을 분리한다. `BRAINPOOL Proposal DB`는 새로운 데이터를 정식 원본으로 저장하는 DB가 아니라, **원본에 반영되기 전 제안·근거·수정·승인·적용 이력을 보존하는 공통 제안 공간**으로 사용한다.

- CoreHub, HajunAI, CoreRing 및 기타 허용된 producer는 Proposal DB에 제안을 생성할 수 있다.
- producer는 기존 원본 DB에 직접 쓰거나 제안 상태를 `approved`/`applied`로 바꿀 수 없다.
- 사람의 승인 후에도 제안은 자동 복사가 아니라 대상 Core의 검증된 adapter를 통해서만 적용한다.
- 승인된 **신규 정식 등록**과 기존 원본의 **변경 요청**을 서로 다른 proposal type으로 구분한다.
- 원본 Message와 기존 Core 데이터는 덮어쓰지 않는다. 수정·삭제가 필요하면 별도 change/delete proposal로 다룬다.

이 문서는 구조 제안이며, Proposal DB 생성·삭제, migration, 기존 원본 DB 변경을 승인하지 않는다.

## 2. 배경

BRAINPOOL의 상위 원칙은 다음과 같다.

- `Message`는 원본 중심의 Single Source of Truth다.
- 원본은 Core가 소유하고, 상위 계층은 원본을 읽어 해석·연결·제안한다.
- HajunAI의 `contexts`는 원본이 아니라 HajunAI가 만든 현재 이해 상태다(ADR-CONTEXT-000).
- AI가 선택하거나 채택한 결과는 사람의 프로젝트 결정과 다르다(ADR-CONFIRM-000).
- Hermes Phase 0는 행동 후보를 제안할 뿐 실제 실행하지 않는다(ADR-HERMES-000).

그러나 여러 Core가 새로운 학습 데이터, 연결, 의미, context 후보, 언어 확장 또는 변경 요청을 만들 때 다음 문제가 생긴다.

1. 제안이 기존 원본 DB에 직접 기록되면 원본과 해석 결과가 섞인다.
2. AI가 만든 결과가 승인 없이 사실·결정·정식 데이터로 승격될 수 있다.
3. 제안의 원문, 생성 주체, 근거, revision, 승인자, 실제 반영 결과를 한 곳에서 추적하기 어렵다.
4. 승인 재시도나 worker 재실행 시 동일 데이터가 중복 반영될 수 있다.

Proposal DB는 이 문제를 해결하지만, Core별 원본 DB를 통합하거나 대체하지 않는다.

## 3. 결정된 계층

```text
Message / Core 원본
        │
        ├─ CoreRing: 언어·학습 관점의 해석
        ├─ CoreHub: Message 사이의 연결·노출·관계 제안
        └─ HajunAI: 누적 맥락의 이해·재구성·제안
                         │
                         ▼
              BRAINPOOL Proposal DB
              (제안·근거·revision·승인 이력)
                         │
                  사람 검토·승인
                         │
             대상 Core의 제한된 adapter
                         │
                         ▼
              해당 Core의 공식 데이터
```

Proposal DB의 데이터는 **제안 상태**다. Proposal DB에 저장됐다는 사실만으로 원본, 사실, 결정 또는 공식 데이터가 되지 않는다.

## 4. 제안 유형

### 4.1 `new_record`

기존 원본에 존재하지 않는 새 정식 record의 등록을 제안한다.

예: 새 학습 항목, 새 의미 후보, 새 연결 유형, 새 Knowledge Unit 후보.

승인 후에는 대상 Core adapter가 schema와 소유권을 검증하고 새 record를 생성한다. 기존 Message는 수정하지 않는다.

### 4.2 `change_request`

기존 원본 또는 정식 record를 변경하자는 요청이다.

- 기존 payload를 덮어쓰지 않는다.
- 변경 전 원본 식별자와 현재 revision/version을 함께 제시한다.
- 승인 시 대상 Core의 versioning·append-only·change log 계약에 따라 적용한다.
- 현재 원본이 proposal 작성 당시와 달라졌으면 conflict로 중단한다.

### 4.3 `delete_request`

삭제가 필요한 경우에도 별도 제안으로 만든다.

- 제안 DB에서 원본을 삭제하지 않는다.
- 보존·감사·법적 요구를 먼저 확인한다.
- 승인 후에도 대상 Core의 soft-delete 또는 별도 폐기 정책을 통해서만 적용한다.

### 4.4 `interpretation` / `action_suggestion`

해석, 연결, 추천, 다음 행동 후보를 기록한다. 이 유형은 승인 전까지 원본 변경을 일으키지 않는다.

Hermes의 Phase 0 행동 후보와 AI가 채택한 응답은 자동으로 `decision` 또는 `new_record`가 되지 않는다.

## 5. 논리 모델

초기 구현 시 물리 테이블명과 세부 column은 별도 schema ADR에서 확정한다. 다음 논리 객체는 필수 계약이다.

### 5.1 Proposal

제안의 identity와 현재 lifecycle 상태를 보유한다.

```text
proposal_id
proposal_type
target_core
target_schema
target_table
target_record_id nullable
created_by_type          -- human, corehub, hajunai, corering, system
created_by_id nullable
status
current_revision_id
idempotency_key
created_at
submitted_at nullable
decided_at nullable
applied_at nullable
```

`target_table`은 자유로운 SQL 대상이 아니다. 허용된 target registry와 adapter가 검증해야 한다.

### 5.2 Proposal Revision

제안 payload를 append-only로 보존한다.

```text
revision_id
proposal_id
revision_no
payload
reason
created_by_type
created_by_id nullable
created_at
```

제출 후 내용을 수정하지 않는다. 수정이 필요하면 새 revision을 만든다. 승인 결정은 반드시 특정 revision을 가리킨다.

### 5.3 Evidence

제안의 근거와 원본 연결을 보존한다.

```text
evidence_id
proposal_id
source_core
source_schema
source_table
source_record_id nullable
source_message_id nullable
evidence_snapshot
source_revision nullable
created_at
```

Evidence snapshot은 당시 근거를 재현하기 위한 기록이다. 이것이 원본 Message의 복제본이거나 원본을 수정할 권한을 의미하지 않는다. 원본이 변경되거나 삭제되면 현재 상태와 snapshot의 차이를 표시한다.

### 5.4 Approval Decision

사람의 검토 결정을 append-only로 기록한다.

```text
decision_id
proposal_id
revision_id
decision              -- approved, approved_with_changes,
                       -- rejected, needs_revision
decided_by
decision_reason
created_at
```

`adopted`, AI score, AI reviewer 선택 결과는 사람의 `approved`를 대체하지 않는다. `approved_with_changes`인 경우 변경 내용은 새 revision으로 남기고 그 revision을 다시 승인 대상으로 삼는다.

### 5.5 Application Run

승인된 제안을 대상 Core에 적용한 실행 이력을 기록한다.

```text
application_run_id
proposal_id
revision_id
target_core
target_schema
target_table
target_record_id nullable
adapter_name
adapter_version
apply_status          -- started, applied, conflict, failed
idempotency_key
result_snapshot nullable
error_code nullable
started_at
finished_at nullable
```

`applied`는 실제 대상 Core가 성공을 확인한 경우에만 기록한다. adapter가 실패하면 원본은 변경되지 않은 채 `failed` 또는 `conflict`로 남겨야 한다.

## 6. 상태 전이

```text
draft
  ↓ submit
submitted
  ├─ needs_revision → revised revision → submitted
  ├─ rejected       → terminal
  └─ approved / approved_with_changes
                         ↓
                      applying
                         ├─ conflict → conflict
                         ├─ failed   → failed / 재검토
                         └─ applied  → terminal success
```

규칙:

- AI와 producer는 `draft`, `submitted`, `needs_revision`까지만 만들 수 있다.
- 사람 승인자만 `approved`, `approved_with_changes`, `rejected`를 기록할 수 있다.
- Apply worker는 승인된 revision만 `applying`으로 전환할 수 있다.
- Worker가 `applied`를 임의로 선언하지 않는다. 대상 adapter의 성공 응답과 application run을 함께 남긴다.
- terminal 상태의 proposal은 같은 idempotency key로 중복 생성하지 않는다.
- 승인 후 원본이 바뀌면 자동 적용하지 않고 `conflict`로 멈춘다.

## 7. 권한과 소유권

| 주체 | Proposal DB | 기존 원본 DB |
|---|---|---|
| HajunAI | 제안·revision·근거 생성 | 직접 쓰기 금지 |
| CoreHub | 제안·revision·근거 생성 | 직접 쓰기 금지 |
| CoreRing | 제안·revision·근거 생성 | 직접 쓰기 금지 |
| 사람 검토자 | 승인·수정 승인·거절 | 직접 SQL 쓰기 금지 |
| Apply Worker | 승인된 revision 조회·적용 실행 | 허용된 adapter로만 제한적 반영 |
| 대상 Core | 적용 결과 확인·정식 소유 | 자기 원본의 최종 소유자 |

- Proposal DB의 AI role은 `approved`, `applied` 상태를 직접 변경할 수 없다.
- 원본 DB의 `service_role`을 AI producer에게 제공하지 않는다.
- Apply Worker의 권한은 target registry와 adapter별 allowlist로 제한한다.
- 제안자와 승인자는 분리한다. 동일 주체의 자동 self-approval은 허용하지 않는다.
- 모든 접근은 proposal, revision, actor, timestamp 단위로 감사 가능해야 한다.

## 8. 원본 보존 규칙

1. Message 원문은 변경하지 않는다.
2. 분석·번역·요약·학습·연결·context는 원본 Message의 대체물이 아니다.
3. AI 결과를 원본으로 확정하려면 별도 `new_record` proposal과 사람 승인이 필요하다.
4. 기존 record 수정은 `change_request`로만 제안한다.
5. 원본 삭제는 `delete_request`와 별도 보존 검토 없이는 실행하지 않는다.
6. Proposal DB의 payload와 evidence는 source-of-truth가 아니라 승인 전 provenance 기록이다.
7. 승인된 제안이 정식 데이터가 되면 대상 Core가 새 공식 record와 반영 이력을 소유한다.

핵심 문장:

> **메시지는 변하지 않는다. 해석은 Proposal DB에 제안으로 쌓이고, 승인된 결과만 해당 Core의 공식 데이터가 된다.**

## 9. 중복·동시성·충돌

- producer는 안정적인 `idempotency_key`를 제공해야 한다.
- 동일 actor·proposal type·target scope·key의 재시도는 하나의 proposal/revision 결과로 수렴해야 한다.
- 동일 proposal에 대한 동시 승인과 적용은 revision과 optimistic concurrency로 직렬화한다.
- 승인된 revision을 재적용해도 대상 Core에 중복 record가 생성되지 않아야 한다.
- 적용 전 대상 record의 version 또는 fingerprint를 확인한다.
- 불일치가 있으면 원본을 덮어쓰지 않고 `conflict`로 남긴다.
- 실패 재시도는 application run을 새로 남기되 승인된 revision과 idempotency 계약을 유지한다.

## 10. 보안·RLS 기본선

Proposal DB는 새 데이터 생성 공간이므로 처음부터 다음을 적용한다.

- 모든 proposal은 명시적인 actor와 target core를 가진다.
- actor가 소유하지 않은 proposal의 수정·승인·조회는 금지한다.
- 승인 결정은 승인자 identity와 decision reason 없이는 생성할 수 없다.
- evidence snapshot에 access-controlled 원본 내용이 포함되면 최소 정보만 저장하거나 암호화·참조 방식으로 보존한다.
- producer는 자기 제안만 생성·조회하고, 다른 Core의 승인 상태를 변경하지 못한다.
- RLS policy, role grant, adapter credential은 실제 staging에서 검증한다.
- Proposal DB migration은 원본 DB migration과 별도로 versioning하고, 운영 원본에 자동 실행하지 않는다.

구체적인 RLS policy와 SQL은 이 ADR의 승인 이후 별도 구현 ADR에서 작성한다. 이 문서만으로 DB에 `CREATE`, `INSERT`, `UPDATE`, `DELETE`를 실행하지 않는다.

## 11. 적용 adapter 경계

각 target Core는 허용된 proposal type과 schema를 선언하는 adapter를 가진다.

```text
Proposal DB
   ↓ validate proposal/revision/approval
Target Core Adapter
   ↓ validate target, ownership, current version, idempotency
Target Core transaction
   ↓
Application Run + result
```

adapter는 다음을 보장해야 한다.

- 임의 schema/table/column으로 쓰지 않음
- payload schema 검증
- target Core ownership 검증
- 승인된 revision과 현재 원본 version 비교
- 성공·실패·충돌을 명시적으로 반환
- retry 시 중복 반영 방지

Proposal DB가 모든 Core의 공통 원본이 되도록 adapter를 우회하는 양방향 동기화는 만들지 않는다.

## 12. 범위와 비범위

### 포함

- 공통 proposal identity
- append-only revision과 evidence
- 사람 승인과 승인 이력
- 승인된 결과의 제한된 application run
- 신규 등록과 기존 변경 요청의 분리
- idempotency, conflict, audit, RLS 원칙

### 제외

- 기존 `hajunai` DB를 Proposal DB로 자동 전환
- CoreNull/CoreHub/HajunAI 원본 schema 통합
- 기존 Message migration 또는 복제
- 자동 승인
- AI의 원본 DB 직접 쓰기
- 자유형 SQL 실행 worker
- 승인만으로 모든 대상 Core에 자동 broadcast
- 이 ADR만으로 실제 DB 생성·삭제·migration 실행

## 13. 수용 기준

구현·staging 검증은 다음을 만족해야 한다.

1. AI producer가 proposal은 만들 수 있지만 `approved`/`applied`를 만들 수 없다.
2. proposal revision은 append-only이고 승인 decision이 특정 revision을 가리킨다.
3. 동일 idempotency key 재전송은 중복 proposal을 만들지 않는다.
4. 동일 proposal을 두 명의 worker가 동시에 적용해도 정식 record는 하나만 생성된다.
5. 승인 후 원본 version이 바뀌면 적용이 `conflict`로 중단된다.
6. rejected proposal은 원본 DB에 아무 변화도 만들지 않는다.
7. failed application은 원본 변경 없이 재시도 가능한 이력을 남긴다.
8. 신규 등록과 기존 변경 요청이 서로 다른 adapter 경로를 사용한다.
9. 모든 approval/application run에 actor, revision, timestamp, result가 남는다.
10. Message 원문과 기존 Core 원본은 proposal 생성·승인만으로 변경되지 않는다.

## 14. 상태와 다음 결정

현재 상태는 **Proposed**다. 다음 단계는 구현이 아니라 사람 승인 전 검토다.

1. Proposal DB의 Decision Owner와 승인자 역할 확정
2. target Core registry와 허용 adapter 목록 확정
3. proposal payload의 최소 schema 확정
4. disposable staging project 생성 여부 결정
5. 별도 migration/implementation ADR 작성
6. staging에서 RLS, grant, idempotency, conflict, approval boundary 검증

이 ADR이 Accepted 되기 전에는 새 Proposal DB를 생성하거나 기존 `hajunai` DB를 삭제하지 않는다.
