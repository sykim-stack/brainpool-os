

## 27. 2026-11-23 결정 기록: CoreHub facts 위험 및 Vercel 배포 보호 (A+B)

**상태:** 사용자 결정 A+B. 위험은 문서화하고 배포 보호는 Vercel 프로젝트 소유자가 별도로 적용한다. 이 보충 기록 작성은 Vercel 설정, 운영 API, 키, 코드 또는 배포를 변경하지 않았다.

- §23의 위험 평가는 **잠재 고위험 / 런타임 노출 미검증**으로 유지한다. 정적 handler 관찰이나 보호 설정 metadata만으로 실제 미인증 외부 접근 또는 데이터 노출을 확정하지 않는다.
- Vercel Deployment Protection은 배포 URL 접근을 제한하는 경계 통제다. 이는 handler의 애플리케이션 인증·인가를 대체하지 않는다.
- 소유자는 Vercel Dashboard에서 대상 프로젝트의 식별자와 현재 설정을 먼저 확인한다. 공개 production 도메인을 유지해야 하면 Standard Protection이 production 도메인을 보호하지 않을 수 있음을 고려한다. production까지 제한해야 하는 경우에만 All Deployments 범위를 검토하고, 공개 사이트 영향과 복구 계획을 먼저 확인한다.
- 기본 검토 방식은 권한 있는 Vercel 계정만 접근하는 Vercel Authentication이다. Password Protection을 택할 때는 현재 요금제·프로젝트별 비용을 확인하고 승인받는다. 설정 변경 후에는 Preview와 production URL을 구분해 인증 전/후 동작을 확인하고, 실제 적용 전까지 미적용으로 기록한다.
- 자동화 우회 토큰, 공유 링크, 보호 비활성화는 이 결정에 포함되지 않는다. handler 인증, DB 권한/RLS, 자격 증명 변경은 별도 설계와 승인 대상으로 유지한다.

참고: [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection), [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication), [Deployment Protection usage and pricing](https://vercel.com/docs/deployment-protection/usage-and-pricing).

## 28. 2026-11-23 격리 단계 기록: ③ 검토 실행 절차

③은 Path S 본선과 CoreHub facts 위험 검토를 별도 트랙으로 나누는 조건으로 정리했다. 가이드와 체크리스트 항목별 실행 절차서는 작성했으나, 이번 세션에서 체크 항목을 실제 저장소/인프라에 대해 실행하거나 승인한 것은 아니다.

- Path S 작업은 소유자가 승인한 범위와 비운영 환경에서 수행하며 CoreHub facts Production 경로를 호출하지 않는다.
- facts 검토는 우선 읽기 전용 코드·설정 조사로 제한한다. 서비스 키 값은 조회·복사·로그·문서화하지 않는다. 운영 데이터 변경, 운영 endpoint 호출, handler 수정, 배포 보호 변경/우회 및 배포는 별도 승인 전 금지다.
- 런타임 검증이 필요하면 별도 승인, 비운영 환경 확인, 합성 데이터, 정확한 URL·메서드·요청 수·부작용 제한을 먼저 확정한다. 조건이 하나라도 불명확하면 실행하지 않는다.
- 프로젝트/환경 식별, 현재 작업 트리 보존, 두 트랙의 파일 충돌, 인증·권한 경로, service credential의 서버 전용 사용, 테스트 대상과 배포 범위, 변경·롤백 계획을 각각 증거와 함께 체크한다. 미확인 상태를 통과로 표기하지 않는다.
- 발견된 정적 코드 사실은 실제 exploit·외부 노출이 입증된 것과 구분한다. 운영 영향이나 비밀정보 노출이 의심되면 관련 트랙만 중단하고 소유자에게 보고한다. 키 교체나 롤백은 자동 수행하지 않는다.

상세 산출물은 이 저장소의 별도 가이드 파일로 아직 추가하지 않았다. 현재 세션에서 생성한 로컬 문서는 참고 자료이며, GitHub 반영 대상은 본 마스터의 본 섹션이다.

## 29. 2026-11-23 본선 연결 단계 기록: ④ 준비 및 진행 게이트

④의 준비·검증 가이드를 작성했다. 이는 구현 착수 보고가 아니다. 현재 본선 통합의 저장소/기준 커밋, 구체 Path S 기능 범위, 연결 상대 소유자, 승인된 API 계약 및 비운영 endpoint가 이 대화에서 새로 확정되지 않아 **Gate 0 준비 대기**로 기록한다.

### 사전 진행 조건

1. 저장소, 기준 브랜치/커밋, 기존 작업 트리 변경사항을 확인하고 보존한다.
2. Path S 범위·허용 변경 파일·완료 기준과 기술/제품 승인자를 확정한다.
3. 기존 모듈·schema·API 클라이언트·mock/fixture 및 공식 계약을 먼저 조사해 재사용한다. 기존 자산으로 충족할 수 없을 때에만 새 endpoint, 구조, 환경변수 또는 데이터 구조를 별도 제안한다.
4. 개발/테스트/Preview 환경과 데이터가 Production과 분리되었음을 확인한다. 운영 자격 증명/데이터를 테스트에 쓰지 않는다.
5. 요청·응답 계약, 인증 주체, 권한, 오류/timeout/retry 동작, 데이터 부작용과 외부 호출 범위를 합의한다.

### 단계적 통합 및 완료 기준

- 계약 테스트와 로컬 검증은 mock 또는 명시된 비운영 경로를 사용하고, CoreHub facts Production 경로를 호출하지 않는다.
- 최소 변경만 적용하고, 자격 증명은 서버 전용으로 유지한다. 테스트·로그·보고서에 키나 토큰을 남기지 않는다.
- 자동 검사와 비운영 통합 검증 결과, 관련 diff, 잔여 위험 및 롤백 계획을 리뷰한다. Production 배포는 별도 승인 단계다.
- 테스트가 운영 자원에 접근하거나, 데이터 쓰기/삭제·비밀정보 노출·예상 밖 외부 효과가 생길 수 있거나, 대상 환경이 불명확하면 해당 작업을 중단한다. 운영 DB/API 테스트, handler 수정, 키 변경, Vercel 보호 설정 및 배포는 별도 범위와 승인 전에는 하지 않는다.

### 현재 결정

**④ 상태: 가이드 작성 완료 / 실제 연결 구현 미착수 / Gate 0 정보·승인 대기.** 다음 착수 입력은 저장소 및 기준 커밋, Path S의 구체 기능 범위, 상대 서비스와 계약, 승인된 비운영 환경/URL, 리뷰어·승인자다. 이 항목이 확인되면 먼저 읽기 전용으로 기존 자산과 인터페이스를 매핑한다.


## 30. 2026-11-23 CoreHub Facts/Auth UID/outbox 트랙: 읽기 전용 검토

**상태:** 기존 통합 작업의 현행 코드·PR·계약을 대조했다. 이번 단계는 검토/문서화만 수행했으며 코드, PR, DB, API, staging 또는 배포 설정은 변경하지 않았다. CoreHub `main` 기준 SHA `932cd90d3a72935992b2fe32046512fdbf8bb768`, CoreNull `main` 기준 SHA `2888653a5c2db1c673a18e3e06ffd992cef2d5c8`이다. 검토 시점 CoreHub PR #2/#3/#4는 open draft이며, CoreNull PR #32 Stage A는 2026-11-12에 merge된 상태다.

### 현행 경로와 기존 작업의 연결

- CoreNull Stage A는 현재 `corenull_message_outbox`를 사용한다. Message 저장 다음 별도 요청으로 outbox를 적재하고, worker가 `/api/corehub/facts`에 `source/fact_type/owner_key/house_id/occurred_at/payload`를 보내며 `Authorization` 헤더는 보내지 않는다. 현재 payload에는 verified `owner_id`, `event_id`, `source_revision`, `payload_sha256` 계약이 없다.
- CoreNull의 별도 session handoff에는 verified Auth UID로 기존 owner mapping을 조회하는 경로가 있다. 그러나 현재 outbox producer/worker에는 그 Auth UID mapping이 연결되지 않았다. 따라서 “CoreNull에 Auth UID mapping 코드가 전혀 없음”이 아니라 “기존 mapping 기능과 CoreHub outbox가 아직 연결되지 않음”으로 구분한다.
- CoreNull Stage A 문서가 명시한 미보장은 Message/outbox 동일 transaction, Auth UID canonical producer, worker claim/lease, quarantine 및 source_revision 기반 event identity다.
- CoreHub `main`의 Facts handler는 현재 `owner_key` 기반 수신과 조회·insert 흐름이다. handler 코드의 정적 관찰만으로 실제 배포 노출이나 런타임 보호 상태를 확정하지 않는다.

### 관련 PR·계약 대조

- CoreHub PR #2 head `e62310abcb1efbdeec8357564c3ca2cfb7484054`는 user Fact 요청에 Supabase Bearer 검증을 제안하고 worker 요청에는 HMAC device principal을 제안한다. 현재 CoreNull worker는 이 인증을 보내지 않으며, PR #2 worker handler는 요청 body의 `owner_key`와 `house_id`도 거부한다. 따라서 현 producer를 PR #2와 그대로 연결할 수 없다.
- CoreHub PR #3 head `b8b0c750c9fa76db7b94479e0816ef6d5ca4c307`의 Message event 계약은 `event_id/source_record_id/source_revision/verified owner_id/payload_sha256` envelope와 전용 `message_events` 저장 모델을 제안한다. 반면 PR #2의 device message 경로는 `corehub.facts`에 적재하는 RPC를 호출한다. 저장 경계와 event contract를 두 PR 사이에서 먼저 맞춰야 한다.
- PR #3은 HMAC이 worker를 인증하더라도 `owner_id`가 실제 Auth UID임을 증명하지 못한다고 명시한다. PR #2의 device principal만으로 owner/house ownership을 추정하지 않는다.
- PR #2 head는 `payload_sha256`의 모양만 검사하고 canonical payload를 재계산하지 않는다. 관련 device RPC의 duplicate 비교도 PR #3이 요구하는 모든 immutable field 및 secondary event identity 비교와 일치하지 않는다. 이는 정적 코드 검토 결과이며, 실행 테스트 결과가 아니다.
- PR #2 head에는 임시 `hmac-debug` GET route가 포함되어 있다. secret 자체는 반환하지 않지만 secret 환경변수 이름, 설정 여부, 길이, 공백 여부 및 실행 환경 값을 공개하므로 merge 전에 제거할 검토 항목으로 기록한다.

### 통합 진행 판정

**현재 판정: 기존 본선 작업을 이어갈 수 있으나 producer 활성화 및 E2E는 보류.** 새 시스템을 설계하자는 결론이 아니다. 이미 있는 CoreNull Stage A, Auth-to-owner mapping, CoreHub PR #2/#3 계약을 기준으로 다음 차이를 해소해야 한다.

1. verified Auth UID와 기존 owner_key mapping을 outbox producer가 사용하는 경로 및 미연결/충돌 시 fail-closed 동작을 확정한다.
2. 기존 PR #2와 #3 중 Stage A Message를 수신할 실제 경로·저장 모델·이벤트 envelope를 한 계약으로 정합시킨다.
3. CoreNull worker 인증 및 payload를 확정된 CoreHub 수신 계약과 호환시킨다. hash 재계산, 정확한 replay 비교, DB 원자적 idempotency, retry/quarantine 처리를 staging에서 확인한다.
4. disposable staging에서 신규 저장, 동일 event replay, 변경 payload conflict, 동시 replay, ownership 거부, commit/응답 유실을 검증하고 결과/rollback을 남긴 뒤 운영 적용은 별도 승인으로 다룬다.

이 검토는 이전 A+B 결정이나 Vercel 소유자 측 보호 설정을 변경하지 않았다. Vercel 설정과 실제 배포 endpoint의 런타임 보호 여부는 이번 읽기 전용 저장소 검토에서 확인하지 않았다.

### 문서 연속성 메모

GitHub `main`에서 읽은 이 마스터 파일의 본문은 §29에서 끝나 있었다. 앞선 대화 요약에는 §32 기록이 언급되어 있었지만, 현재 확인된 이 경로의 `main` 본문에서는 해당 섹션을 찾지 못했다. 따라서 확인 가능한 기존 본문을 보존하고 다음 번호인 §30으로 이번 검토를 추가했으며, 확인하지 못한 §30~§32 내용을 추정해 복원하거나 덮어쓰지 않았다.

참고: [CoreHub PR #2](https://github.com/sykim-stack/brainpool-corehub/pull/2), [CoreHub PR #3](https://github.com/sykim-stack/brainpool-corehub/pull/3), [CoreNull Stage A PR #32](https://github.com/sykim-stack/brainpool-corenull/pull/32), [CoreNull Stage A 신뢰성 상태](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/doc/CORENULL_OUTBOX_STAGE_A_RELIABILITY_2026-11-12.md), [CoreNull outbox 설계 v1](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/doc/CORENULL_COREHUB_MESSAGE_OUTBOX_DESIGN_v1.md).
