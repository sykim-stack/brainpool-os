# ADR-IDENTITY-OWNERSHIP-001 — Auth UID ↔ owner_key ↔ House ownership 정렬

_상태: Proposed — 사람 승인 전_
_작성일: 2026-10-16_
_관련: Identity_Platform_Architecture_v1.0 · ADR-ACCESS-001 · ADR-ACCESS-002 · CoreNull · CoreHub_

## 결정 요약

Supabase Auth UID는 **요청자를 검증하는 보안 주체**로 사용하고, `owner_key`는 BRAINPOOL Identity Platform의 기존 Primitive로 보존한다. House에는 두 식별자를 연결하는 nullable ownership link를 두며, 검증되지 않은 legacy House는 자동 연결하지 않는다.

이 문서는 CoreNull 또는 CoreHub의 운영 migration을 승인하지 않는다. 구현 계약을 정렬하기 위한 제안이다.

## 배경

현재 저장소 조사에서 세 가지 식별자 체계가 확인됐다.

| 식별자 | 현재 의미 | 상태 |
|---|---|---|
| `device_id` | 기기 단위 legacy 식별자 | 과도기/legacy |
| `owner_key` | CoreNull 및 Identity Platform의 소유자 Primitive | 현재 canonical application identity |
| Supabase `auth.users.id` | 로그인 token으로 검증 가능한 사용자 ID | 보안 assertion 주체 |

현재 CoreNull은 `public.corenull_houses.owner_key`를 사용하고, Google 로그인은 provider subject를 `owner_key`에 연결한다. 반면 CoreHub PR #2는 검증된 Auth UID와 `corenull.houses.owner_id`를 House ownership 기준으로 기대한다. 두 계약 사이에 명시적 mapping과 동일한 canonical House table이 없다.

## 원칙 정렬

이 ADR은 다음 기존 원칙을 폐기하지 않는다.

1. `owner_key`는 Identity Platform Primitive다.
2. `One owner_key = One House` 원칙을 유지한다.
3. House는 Identity의 공간적 표현이며, Room은 House 안에서 생성된다.
4. CoreNull은 View/Space Layer 책임을 유지한다.
5. CoreNull이 Identity Platform 전체 Auth 설계를 독자적으로 재정의하지 않는다.
6. Auth UID는 `owner_key`의 자동 대체값이 아니다.

## 제안 계약

실제 연결 project에서 확인된 canonical House table은 기존 `corenull.houses`다.

```text
corenull.houses.id
corenull.houses.owner_key   -- 기존 Identity Primitive, 보존
corenull.houses.owner_id    -- verified auth.users.id, nullable link
```

- `owner_id IS NULL`: legacy/unlinked House
- `owner_id IS NOT NULL`: verified Auth UID와 연결된 House
- 한 `owner_id`가 여러 House를 소유하는지 여부는 `owner_key` 1인 1집 규칙과 별도로 검증한다. migration에서 임의 unique constraint를 추가하지 않는다.
- CoreHub는 client body의 `owner_id`/`owner_key`를 신뢰하지 않고 token에서 검증된 Auth UID를 사용한다.
- CoreHub의 House ownership query는 실제 canonical `corenull.houses` table을 조회한다.

## 신규 사용자 흐름

1. Supabase Auth가 provider token을 검증하고 `auth.users.id`를 발급한다.
2. 서버가 provider subject와 Auth UID를 같은 검증된 identity에서 얻는다.
3. Identity Platform이 새 `owner_key`를 생성하거나 기존 verified mapping을 복원한다.
4. House는 `owner_key`와 `owner_id`를 함께 기록한다.
5. CoreNull API의 owner 판단은 client-supplied 값이 아니라 verified server context를 사용한다.
6. CoreHub Fact는 verified Auth UID와 canonical House ownership이 일치할 때만 허용한다.

## 기존 사용자·legacy House 흐름

기존 `owner_key`, `device_id`, Google subject를 자동으로 Auth UID에 backfill하지 않는다.

1. 사용자가 Auth provider로 로그인한다.
2. 서버가 provider subject, Auth UID, 기존 identity mapping을 확인한다.
3. mapping이 명확하고 사용자가 명시적으로 연결을 요청한 경우에만 `owner_id`를 기록한다.
4. 충돌하거나 증거가 부족하면 `IDENTITY_CONFLICT` 또는 `unlinked` 상태로 남긴다.
5. `corenull.houses.owner_id IS NULL` House는 CoreHub Fact 전송 대상에서 제외하거나 quarantine한다.
6. 기존 `owner_key`와 House 데이터는 연결 실패 시에도 삭제·변경하지 않는다.

## 금지 사항

- `owner_key` UUID를 Auth UID로 간주
- Google subject를 Auth UID로 직접 저장
- 모든 legacy House에 일괄 `owner_id` backfill
- CoreHub에 중복 House table 생성 후 양방향 동기화
- `service_role`을 사용자 identity assertion으로 사용
- CoreNull이 CoreHub/Identity Platform의 최종 Auth 정책을 독자적으로 확정
- 운영 DB에 migration을 승인 없이 적용

## Staging 수용 기준

다음 테스트가 별도 staging에서 모두 통과해야 Accepted 검토를 시작한다.

- User A token → User A House: 성공
- User B token → User A House: `403`
- invalid/expired token: `401`
- body 위조 `owner_id`/`owner_key`: 거부
- unlinked House: 자동 연결·송신 금지
- 동일 identity mapping 재요청: idempotent
- 다른 Auth UID로 기존 provider subject 연결: `409`
- duplicate Fact: `200 duplicate`
- 동일 key·다른 payload: `409`
- mapping과 House update가 원자적으로 처리됨

## 후속 책임

| 영역 | 책임 |
|---|---|
| Identity Primitive와 mapping 규칙 | Identity Platform / 사람 승인 |
| Auth session·House API 구현 | CoreNull |
| Fact owner 검증·idempotency | CoreHub |
| 실제 provider/Auth 설정 | 운영 담당자 |
| legacy 연결 승인 | 사람 승인 |

## 상태

**Proposed.** 이 ADR은 현재 identity mapping gap을 기록하고 정렬안을 제안하지만, Auth UID mapping, 운영 migration, worker 인증을 승인하지 않는다. 실제 연결 project의 `corenull.houses.owner_id` 존재 확인은 House-column 추가 migration을 대체하며, staging에서는 기존 `public.corenull_owner_identities`에 Auth UID 연결 컬럼만 확장한다.
