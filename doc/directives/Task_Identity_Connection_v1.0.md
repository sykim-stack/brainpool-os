# 작업지시서 — 클로3 (코어널) / LinkCredential 통합 v1.0

**발신**: 클로1 (총괄 / Architecture)  
**수신**: 클로3 (코어널 담당)  
**날짜**: 2026-07-19  
**근거 문서**: Identity Platform Architecture — Decision Log (2026-07-19)

---

## 0. 작업 성격 안내
본 작업은 CoreNull 기능 확장이 아닌 **Identity Platform(owner_key)** 인프라 작업입니다. Identity 플랫폼의 구현 책임은 현재 CoreNull 저장소가 담당하나, 이는 물리적 위치일 뿐 개념적으로는 모든 Core가 참조하는 **Platform-level** 자산임을 인지하고 작업해 주십시오.

## 1. 배경 및 목적
기존 `link_codes` 시스템(6자리 코드)을 일반화하여 **초대(Invite)와 복구(Recover)**를 하나의 메커니즘으로 통합합니다. 새로 만드는 것이 아니라 기존 로직을 `target` 필드를 통해 확장하는 것이 핵심입니다.

## 2. 핵심 설계 (LinkCredential)
기존 `link_codes` 테이블을 다음과 같이 확장합니다.

| 필드명 | 타입 | 설명 |
| :--- | :--- | :--- |
| **code** | string | 6자리 고유 코드 (기존 유지) |
| **target** | enum | `invite` \| `recover` (신규 필드) |
| **issuer_owner_key** | string | 발급자의 owner_key |
| **receiver_owner_key** | string | (Optional) 복구 대상 owner_key |
| **room_id** | string | (Optional) 초대 대상 Room ID |
| **expires_at** | datetime | 만료 시간 (기존 유지) |

## 3. 작업 범위
- [ ] **DB 마이그레이션**: `link_codes` 테이블에 `target` 컬럼 추가 (기본값 `recover`로 기존 데이터 마이그레이션).
- [ ] **API 확장**: `/api/identity`의 발급 및 확인 라우트에 `target` 파라미터 추가 및 분기 처리.
- [ ] **문서 업데이트**: `Agent_Repo_Mapping.md`에 Identity 코드의 플랫폼 성격 명시.
- [ ] **자가 검증**: 기존 초대 흐름에 영향이 없는지 확인.

## 4. 명시적 금지 사항
- 기존 초대 흐름의 동작을 변경하지 말 것.
- `owner_key` 자체의 생성/삭제 로직을 수정하지 말 것.
- `Message` 및 `Post` 관련 테이블을 수정하지 말 것.

## 5. REPORT 양식 (완료 후 제출)
```text
### 작업 요약
[LinkCredential target 통합 구현 내용]

### 변경 파일
- [파일명]

### Governance Self Check
- [ ] 기존 초대 흐름 정상 동작 확인
- [ ] owner_key 생성/삭제 로직 미변경 확인
- [ ] Message/Post 테이블 미변경 확인
- [ ] target 필드 마이그레이션 시 기존 데이터 손실 없음 확인
```
