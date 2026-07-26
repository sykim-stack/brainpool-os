ADR-ACCESS-001: CoreNull Access Policy (Room Visibility & Access Model)

날짜: 2026-07-25
작성: 클로3 (CoreNull)
상태: Proposed — Architecture + Planning 승인 대기

관련 문서

Master_Prompt_v2.0 §15 (SEO Source Rule)
CoreNull Room & Seed Concept Specification v1.0
Identity Platform Architecture — Decision Log (2026-07-19)
목적

본 ADR은 CoreNull의 Room Visibility를 실제 Access Policy와 연결하기 위한 최초의 공식 접근 제어 정책을 정의한다.

현재 Visibility는 노출 정책(Feed / SEO)에만 적용되고 있으며,
실제 데이터 접근(Read Access)은 제어되지 않는다.

본 ADR은

Visibility = 노출 정책

과

Access = 접근 정책

을 분리하여 정의한다.

배경

현재 Room에는

public
invite
family

3개의 visibility가 존재한다.

그러나 실제 사용 위치는 아래 두 곳뿐이다.

1.
마당(Yard) 피드 노출

↓

public만 노출

2.
SEO

↓

public만 index

반면

Room 조회

Post 조회

API 조회

에서는

room_id

post_id

만 알고 있으면

visibility와 관계없이 내용을 읽을 수 있다.

즉,

현재 Visibility는

Display Policy

일 뿐,

Access Policy

가 아니다.

결정

CoreNull에서는 앞으로

Display Policy

↓

Access Policy

↓

Permission

↓

Data Query

순서로 접근을 판단한다.

Visibility는

"보여줄 것인가"

를 결정하며,

Permission은

"읽을 수 있는가"

를 결정한다.

Visibility Policy

아래 정책으로 확정한다.

public

↓

누구나 접근 가능

invite

↓

관계가 승인된 Neighbor만 접근 가능

family

↓

Room 참여자만 접근 가능

여기서 중요한 점은

invite

와

family

가 서로 다른 Primitive를 요구한다는 것이다.

family

Room 단위 권한

↓

Room Participant

↓

기존 House Membership 재사용 가능

invite

Identity 간 관계

↓

Neighbor

↓

새 Primitive 필요

따라서

두 정책은 분리하여 구현한다.

Phase 1
family Access Policy

새 Primitive는 만들지 않는다.

기존

corenull_house_members

를 그대로 재사용한다.

스키마 변경

room_id UUID NULL
NULL

↓

House 전체 멤버

room_id 있음

↓

특정 Room 참여자

기존 데이터는 그대로 유지된다.

Single Source of Truth를 유지한다.

Access Rule
family

↓

House Owner

또는

Room Participant

↓

허용

그 외

↓

거부
적용 대상
GET /posts

GET /rooms

GET /posts?post_id

모든 조회 경로는 동일한 Access Policy를 사용한다.

공통 헬퍼

resolveAccessPolicy()

에서 처리한다.

향후

House

Room

Post

Seed

모두 동일한 정책을 사용하도록 한다.

Phase 2
invite Access Policy

family와 달리

새 Primitive가 필요하다.

단,

Primitive는

House가 아니라

Identity 간 관계를 표현하는 것이 목적이다.

현재 구현에서는 House를 Identity의 대표 객체로 사용한다.

신규 테이블

corenull_neighbors
id

identity_a

identity_b

status

requested_by

created_at

accepted_at

현재 구현에서는

identity

↓

house

로 매핑한다.

향후

Company

Organization

AI Identity

등으로 확장 가능하도록 설계한다.

Access Rule
invite

↓

Owner

또는

Accepted Neighbor

↓

허용

그 외

↓

거부
Access Flow

향후 CoreNull의 모든 조회는 아래 순서를 따른다.

Request

↓

Access Policy

↓

Visibility Rule

↓

Permission Rule

↓

Query

↓

Response

이 흐름은

Room

Post

House

Seed

전체에서 공통으로 사용한다.

예외 처리

현재 Pipeline Contract에서는

HTTP 403

을 사용할 수 없다.

따라서

status = 500

_error = ACCESS_DENIED

를 사용한다.

이는

현재 Pipeline의 제약 사항이며,

향후 Pipeline 개편 시

HTTP 403

으로 변경한다.

대안 검토
family도 Neighbor로 처리

기각.

family는

이웃도 접근 불가

인 더 좁은 범위이다.

Primitive를 분리하는 것이 맞다.

room_participants 신규 테이블 생성

기각.

corenull_house_members

에

room_id

만 추가하면 동일한 효과를 얻을 수 있다.

Primitive 추가보다

기존 구조 재사용을 우선한다.

영향 범위
corenull_house_members

↓

room_id 컬럼 추가

posts API

↓

Access Policy 적용

rooms API

↓

Access Policy 적용

invite API

↓

변경 없음

Phase2

↓

Neighbor Primitive 추가
테스트 정책

권한 정책은 반드시 Unit Test를 포함한다.

검증 대상

✓ public

✓ invite

✓ family

✓ owner

✓ participant

✓ non-member

✓ direct post access

✓ room access

권한 정책 변경 시 테스트는 필수 항목으로 간주한다.

리스크

배포 이후

기존

family

invite

Room은

링크만으로 접근이 불가능해진다.

이는 의도된 변경이다.

실사용 데이터가 존재할 경우

사전 확인 후 배포한다.

Next Step
[ ] Architecture 승인

[ ] Planning 승인

[ ] Phase1 작업지시서 발행

[ ] house_members.room_id 추가

[ ] Access Policy 구현

[ ] Access Policy Unit Test 작성

[ ] Phase1 검증

[ ] Phase2 Neighbor ADR 작성

[ ] Agent_Repo_Mapping 반영

[ ] clo3.md 업데이트

## Architecture Note

본 ADR은 CoreNull의 첫 번째 공식 Access Policy를 정의한다.

향후 House, Room, Post, Seed를 포함한 모든 CoreNull 리소스는
본 ADR에서 정의한 Access Policy를 공통 기준으로 사용한다.

새로운 접근 제어 요구사항이 발생하더라도,
기존 Primitive를 우선 재사용하며,
새 Primitive는 마지막 선택(New Primitive is the Last Choice)으로 한다.