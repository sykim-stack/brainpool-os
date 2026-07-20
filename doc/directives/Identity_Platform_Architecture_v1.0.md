# Identity Platform Architecture v1.0

**날짜**: 2026-07-19  
**상태**: Active (Official Standard)  
**참여**: 여리 (총괄), 보카 (ChatGPT), 클로 (총괄 검토)

---

## 1. 개요 (Executive Summary)
Identity Platform은 BRAINPOOL OS의 신원(Identity)과 소유권(Ownership)을 정의하는 최상위 인프라 계층입니다. 본 아키텍처는 "로그인 시스템"이라는 좁은 개념을 폐기하고, **Identity First Platform**으로서의 정체성을 가집니다.

## 2. Architecture Decision: 왜 Identity Platform인가?
Identity Platform은 BRAINPOOL의 일부가 아닙니다.
- **Identity Primitive**: `owner_key`는 특정 애플리케이션의 데이터가 아니라, 모든 애플리케이션이 공통으로 사용하는 신원 원자(Primitive)입니다.
- **Platform Independence**: House는 Identity 자체가 아니라, BRAINPOOL이 `owner_key`를 표현하는 방식일 뿐입니다.
- **Universal Applicability**: 본 플랫폼은 BRAINPOOL, Commerce, International, CoreCoop 등 다양한 애플리케이션이 공통으로 사용할 수 있는 독립적 기반으로 유지됩니다.

## 3. Identity Rule: One owner_key = One House
사용자의 신원과 공간은 1:1 대응 관계를 가집니다.
- **Automatic Creation**: House는 사용자가 생성하는 객체가 아닙니다. `owner_key` 생성 시 최초 1회 시스템에 의해 자동 생성됩니다.
- **UX Principle**: 사용자는 House를 만들지 않습니다. 오직 House 안에서 **Room(방)**만을 생성합니다.
  - ❌ 집 만들기 (삭제)
  - ⭕ 방 만들기 (유지)

## 4. 공유 및 소유권 구조 (Sharing & Ownership)
공유방 구조에서도 각 주체의 소유권은 명확히 유지됩니다.
```text
[상열 House]           [티티 House]
     │                      │
     └────▶ [하준 돌잔치 Room] ◀────┘
```
- **House**: 각 사용자의 고유한 삶의 영역 (2개)
- **Room**: 공유되는 활동 공간 (1개)
- **Member**: 다수 참여 가능
- **Principle**: Ownership은 유지하되, Permission을 공유하는 구조입니다.

## 5. LinkCredential — Identity Primitive
초대(Invite), 복구(Recover), 공유(Share)는 동일한 Primitive의 대상(Target) 차이로 정의합니다.

### 5.1. LinkCredential Structure
```text
LinkCredential {
  code: string (Unique)
  target: 'invite' | 'recover' | 'share' | 'sync'
  expires_at: datetime
  issuer_owner_key: string (Originator)
  receiver_owner_key: string (Optional)
  room_id: string (Optional)
}
```

## 6. Application Primitive
Identity Platform은 애플리케이션의 세부 비즈니스 로직(Primitive)을 알지 못하며, 이는 각 애플리케이션의 책임입니다.

## 7. Result
이번 논의를 통해 **"로그인 시스템"**이라는 개념은 공식적으로 폐기되었습니다. BRAINPOOL OS는 Authentication First가 아닌, **Identity First Platform**으로의 전환을 선포합니다.
