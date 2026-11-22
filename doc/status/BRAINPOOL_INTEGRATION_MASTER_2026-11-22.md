# BRAINPOOL 통합연결 작업 마스터 문서

**작성일**: 2026-11-22  
**목적**: 지금까지 분석한 전체 레포와 연결 구조를 하나의 작업 기준 문서로 통합 (새 설계·구현 없음)  
**범위**: HajunAI ↔ CoreNull 인증 연결 (CoreRing은 별도 보류)  
**기반**: `hermes-work-boundaries` 원칙 및 관측된 사실 기록  

---

## 1. 전체 프로젝트 및 레포 구성

| 레포/프로젝트 | 주요 내용 | Production 배포 상태 |
|--------------|----------|----------------------|
| **brainpool-corehub** | CoreHub API (handoff 발급·교환, opportunities API, auth 라우트) | `main`, 커밋 `932cd90` 배포됨. `docs/sql/2026-11-21_auth_handoff_tables.sql` 실행됨. |
| **brainpool-corenull** | CoreNull 앱 `corenull.vercel.app`), Google 로그인·owner_key 매핑, `/auth/handoff` 처리 | `main`, 커밋 `2888653` 배포됨. Google `sub`+Supabase Auth User ID를 기존 Owner에 연결하는 코드 배포됨. |
| **brainpool-clean** | CoreRing 연동 관련 구성 포함 (handover 로직은 아님) | `main` 상태, handoff 버튼 미배포. |
| **hajuncore-app** | HajunAI 클라이언트 `hajuncore-app.vercel.app`), CoreNull·CoreRing 버튼, 대시보드 | `mes/integration-1` 브랜치`9ebe3c6`) 배포됨. CoreNull handoff 경로 포함. |
| **hermes-agent** (메스) | 작업 원칙·스킬 관리 `hermes-work-boundaries` 등) | 로컬 스킬 디렉터리에 저장. |

> **공통 프로젝트**: Supabase 프로젝트 `grlfocvlfatuvphkyivd` 공용 사용 (Shared Supabase Auth 기반 Path S 경로).

---

## 2. 각 서비스의 역할과 책임 경계

| 서비스 | 핵심 책임 | 주의/제한 사항 |
|--------|----------|----------------|
| **HajunAI** | UI 제공, Google 로그인 연계, CoreNull·CoreRing handoff 버튼 노출 | 로그인 상태`access_token`)에 따라 버튼 동작 분기. CoreRing 버튼은 현재 배포에서 미포함. |
| **CoreNull** | Supabase 인증 기반 owner_key 매핑, `/auth/handoff` 처리, house·방·멤버십 조회 | `owner_key` 문자열만으로 인증 불가. identity 매핑`corenull_owner_identities`) 필수. 자동 생성·병합 금지 원칙. |
| **CoreRing** | Hajun과 유사한 handoff 흐름, but ownership 불변 보장 | 현재는 CoreNull 검증 완료 전까지 별도 보류. Hajun 대시보드 항목은 선택 UI만 presence. |
| **CoreHub** | Central API: ticket 발급`/api/auth/handoffs`), 교환`/api/auth/handoffs/exchange`), opportunities API, auth 주체 resolve | Service-role 키 사용. RLS 정책 엄격히 설정 필요. raw token 저장 금지, hash only. |

---

## 3. 서비스 간 API 및 인증 연결 구조

### Path S (Shared Supabase Auth) - 현재 운영 경로

```
[Hajun 클라이언트]
  ↓ Google 로그인 → Supabase access_token 보유
  ↓ Authorization: Bearer *** 헤더 포함
  ↓ [Hajun /api/auth/handoffs] POST {audience: corenull}
  ↓
[CoreHub /api/auth/handoffs] getUser(token) → authUserId 확보
  ↓ ticket 발급 (audience 포함, TTL 60s)
  ↓
[Hajun: ticket hash → URL 파라미터]
  ↓
[CoreNull /auth/handoff] POST {ticket}
  ↓
[CoreHub auth_handoffs 조회] auth_user_id 일치 확인
  ↓
existing owner_key 반환 OR owner_link_required (409) 반환
  ↓
[CoreNull: owner_key 설정 또는 거부] → '/' 리디렉션
```

### 주요 엔드포인트

| 엔드포인트 | 메서드 | 주요 목적 | 비고 |
|-----------|--------|----------|------|
| `/api/auth/handoffs` | POST | ticket 생성, audience 검증, principal resolve | CoreHub 측 로직 이미 구현됨 |
| `/api/auth/handoffs/exchange` | POST | ticket 교환, session token 발급 | CoreHub 내부 로직 |
| `/auth/handoff` | POST | ticket 교환, auth_user_id → owner_key 연결 | CoreNull 전용 라우트 |
| `/api/auth/core-session` | POST | ticket 검증, owner_key 반환 (또는 error) | Hajun 클라이언트에서 호출 |

---

## 4. Google Auth와 Owner 매핑 구조

### 사실 관계 (Observed Fact)

- Google login in Hajun → Supabase JWT `access_token`) 발급.
- `access_token`을 CoreHub `/api/auth/handoffs`에 `Bearer` 헤더로 전송.
- CoreHub `resolveAuthSubjectFromBearer` 수행:
  - ① Supabase Auth `getUser` → `authUserId` 확보.
  - ② 폴백: `corehub.auth_sessions` 테이블에서 `token_hash` 일치하는 레코드 조회.
- 확보된 `authUserId`를 이용해 `ticket` 생성 `audience: corenull` or `corering`).
- 발급된 `ticket`은 URL 해시`#ticket=...`)로 Hajun 클라이언트에 전달.
- Hajun이 `#ticket`을 추출해 `/api/auth/core-session` POST 전달.
- CoreNull 측은 ticket으로 `auth_user_id`를 조회해 `corenull_owner_identities` 매핑 확인.
- 매핑이 존재하면 기존 `owner_key` 반환. 매핑 없으면 `owner_link_required` (409) 반환 → Owner 자동 생성·병합 금지 원칙에 따라 처리.

### 매핑 테이블 `corenull_owner_identities`)

| 컬럼 | 설명 |
|------|------|
| `provider` | `'supabase'` 또는 `'google'` |
| `provider_sub` | `auth.users.id` (Supabase) 혹은 Google `sub` |
| `owner_key` | CoreNull house owner key (문자열) |
| `created_at` | 매핑 생성 시각 |

> **원칙**: `(provider, provider_sub)`의 조합은 유일해야 함. 동일한 Google 계정이 다른 Owner에 매핑되지 않도록 함.

---

## 5. CoreHub handoff 및 보안 구조

### 테이블 스키마 (생성된 SQL 참조)

```sql
-- Short-lived tickets (TTL ~60s)
CREATE TABLE IF NOT EXISTS corehub.auth_handoffs (
  ticket_hash TEXT PRIMARY KEY,     -- SHA-256(token) 인코딩됨
  auth_user_id TEXT NOT NULL,       -- Supabase auth_user_id
  audience  TEXT NOT NULL CHECK (audience IN ('corenull', 'corering')),
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,            -- first redeem 시각
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions issued after redeem (TTL up to 30d)
CREATE TABLE IF NOT EXISTS corehub.auth_sessions (
  token_hash    TEXT PRIMARY KEY,
  auth_user_id  TEXT NOT NULL,
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Principal → owner_key scope (SHARED-OWNER-001)
CREATE TABLE IF NOT EXISTS corehub.auth_owner_links (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  TEXT NOT NULL,
  owner_key     TEXT NOT NULL,
  source        TEXT,           -- 'corenull' | 'manual' | 'import'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at    TIMESTAMPTZ,
  UNIQUE (auth_user_id, owner_key)
);
```

### Security Principles (Observed)

- **RLS 활성화**: `auth_handoffs`, `auth_sessions`, `auth_owner_links` 등은 `anonauthenticated` 직접 SELECT 거부.
- **Service-role 사용**: CoreHub API에서만 접근 허용.
- **Hash-only 저장**: raw ticket/session token 불가, SHA-256 해시만 저장.
- **Invalid ticket handling**: 401/400 반환, 409는 `owner_link_required` (자동 병합 금지 신호).

---

## 6. Git 브랜치와 PR 현황

| 레포 | 브랜치 | 최신 커밋 | 상태 | PR |
|------|--------|-----------|------|-----|
| **brainpool-corehub** | `main` | `932cd90` | Production 배포됨 | `mes/integration-1` → `9ebe3c6` merged |
| **brainpool-corenull** | `main` | `2888653` | Production 배포됨 (Google 매핑 코드) | - |
| **hajuncore-app** | `mes/integration-1` | `9ebe3c6` | Production 배포됨 (CoreNull 버튼 포함) | - |
| **brainpool-clean** | `main` | `1995609` | handoff 미배포 (보류) | - |

> **핵심 커밋 요약**:
> - `2fa1882`: CoreHub 발급·교환 API 최초 도입.
> - `13bbcaf`: CoreNull redeem + Owner 링크.
> - `1995609`: CoreNull redeem (Owner 변경 없음).
> - `b5c8220`: Hajun CoreNull handoff 라우트 + 버튼 배포.
> - `932cd90`: CoreHub exchange 및 SQL 마이그레이션.
> - `e556ee9`: Opportunities Bearer 스코프 정리.
> - `4779ad4`: Hajun handoff proxy + 버튼 + Sidebar.

---

## 6. Production 및 Staging 환경 구분

- 현재 모든 항목이 **Production** 환경에서 동작함 `vercel.app` 도메인 사용).
- Staging 또는 별도 환경 언급 없음. 모든 테스트 및 배포가 Production 기준 진행됨.
- `heroku/local` 등 로컬 테스트는 `corenull.vercel.app`, `hajuncore-app.vercel.app` 등 원격 배포를 기준으로 함.

---

## 7. 현재까지 확인된 문제와 미완료 작업

### 7-1. 확인된 문제 (Fact)

1. **Hajun 버튼 401 오류** (해결됨):  
   원인: Bearer 토큰 또는 `corehub_session` 쿠키 누락.  
   해결: Path S 경로 적용 (Google login + Bearer 헤더 주입).

2. **Owner 매핑 불일치**:  
   원인: `localStorage.corenull_owner_key`가 브라우저 상태에 따라 다른 Owner 영향.  
   해결: DB identity 매핑`corenull_owner_identities`) 우선 원칙.

3. **두 Google 계정 다른 Owner 소유**:  
   사실: Google `…4026` → Owner `47c7…`, Google `…7501` → Owner `e35f…`.  
   영향: 계정 간 Owner 공유 불가 확인.

4. **SNL 집 별도 Owner 소유**:  
   사실: `f0bce18b` Owner 아래 `SNS 어린이 수` 집 존재. 메인 Owner `47c7…`과는 분리됨.

5. **CoreRing 미검증**:  
   상태: CoreNull 검증 완료 후 별도 진행 예정.

### 7-2. 미완료 작업 (Deferred)

- Hajun 세션 전제 점검 후 최종_flow 검증 (이미 Path S로 해결됨).
- CoreRing handoff 별도 진행.
- identity/로컬스토리지 이슈 추가 정리 (필요 시).

---

## 8. 전체 통합 작업 순서

1. **전제 확인**: Same Supabase project? Google login 허용 여부?
2. **SQL 실행**: `docs/sql/2026-11-21_auth_handoff_tables.sql` 적용 (이미 수행됨).
3. **환경변수 설정**: 4개 프로젝트 `COREHUB_API_URL` 등 (이미 수행됨).
4. **Hajun Google login 추가**: client-side Auth 추가, 버튼 상태 분기 (이미 수행됨).
5. **Hajun 버튼 수정**: 로그인 여부 판별 후 `Authorization: Bearer *** 헤더 주입 (이미 수행됨).
6. **CoreHub·CoreNull 검증**: 이미 동작하는 코드 경로 확인 (이미 수행됨).
7. **스모크 테스트**: 정상 ticket → cookie 설정, 만료/재사용 → 에러, owner 링크 없음 → 409 (이미 확인됨).
8. **CoreRing 분리**: CoreNull 검증 완료 후 별도 진행.
9. **작업 종료**: 이상 없음 → 마스터 문서 최종 확정.

---

## 9. 각 작업의 완료 조건과 종료 기록 방식

### 완료 조건

- 해당 단계의 모든 체크리스트 항목이 `✅` 상태여야 함.
- smoke test: normal ticket → cookie set, expired/replay → 401/400, missing owner link → 409.
- Environment variables set across all 4 projects.
- No structural code changes beyond the minimal Path S flow.

### 종료 기록 방식

- **마스터 문서**`this document`)의 respective sections에 `✅` 마크 추가.
- **PR record**: merged PR 해시`9ebe3c6`) 및 커밋 해시 기록.
- **스모크 결과**: `스모크 테스트 결과` 섹션에 정량적 기록.
- **미완료 항목**: `7-2` 항목에 명확한 `미확인/보류` 표기 후 다음 담당자에게 인계.

---

## 10. 미확인 항목 및 다음 단계 안내

아래 항목은 아직 확정되지 않았거나, 다음 담당자 진행이 필요한 항목입니다.

- [ ] **CoreRing handoff** 별도 검증 및 구현 (문서 참조).
- [ ] **Hajun Google 로그인 UI**가 제품에 적합한지 최종 판단 (현재는 내부 도구 성격).
- [ ] **Hajun과 CoreHub가 동일한 Supabase project** 확신 여부 (이미 Path S 전제로 진행했으나, 최종 확인 필요).
- [ ] **SNL 집 `f0bce18b` identity 매핑** 추가 조회 (별도 SQL 실행 필요).
- [ ] **브라우저 로컬스토리지 정리**에 대한 최종 권고안 작성 (이미 `localStorage.corenull_owner_key` 영향 인지済).

> **위 미확인 항목은 다음 작업 이어가기 전, 담당자가 확인 후 체크리스트에 반영하거나 보류 결정**해야 합니다.  
> **기존 원본 문서 수정·삭제, 설계 임의 변경은 금지**됩니다.

---
*본 문서는 BRAINPOOL 통합연결 작업의 마스터 기준 문서이며, 새로운 설계 추측이나 원본 문서 변경을 목적으로 하지 않습니다. 다음 작업자는 '미확인 항목'을 참조하여 진행 계획을 수립하시기 바랍니다.*
