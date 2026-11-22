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

## 11. 2026-11-22 보충 기록: 확인 결과와 승인 경계

이 절은 2026-11-22 기준의 후속 확인 결과다. 위 본문은 당시 작업 snapshot으로 보존하며, 아래 현재 상태가 충돌하는 경우 최신 날짜가 명시된 기록을 기준으로 한다. 별도 원본 status 문서들은 수정하지 않았다.

### 11-1. 통합 DB와 CoreHub 보안

- **사용자 확인**: 현재 서비스는 HajunAI DB로 사용되던 DB를 통합한 **단일 운영 DB**를 사용한다. 별도 `hajunai` Supabase 목록 항목을 staging이나 별도 운영 데이터베이스로 간주하지 않는다. Path S 자료는 통합 Supabase 프로젝트 ref를 `grlfocvlfatuvphkyivd`로 적고 있다.
- 공유 DB의 handoff 호출이나 테스트 쓰기는 금지되어 있어 실행하지 않았다. 기존 owner identity 값은 열람하거나 기록하지 않았다.
- 승인된 migration `enable_corehub_auth_tables_rls`를 Supabase 프로젝트 `grlfocvlfatuvphkyivd`에 적용했다. `corehub.auth_handoffs`, `corehub.auth_sessions`, `corehub.auth_owner_links`에 RLS만 활성화했고 policy는 추가하지 않았으며 FORCE RLS도 적용하지 않았다.
- 사후 검증: 세 테이블 모두 RLS=true, FORCE RLS=false, policy 0개. `anon`/`authenticated` direct table grants는 없고 `service_role`은 RLS bypass와 필요한 권한을 보유한다. handoffs: INSERT/SELECT/UPDATE, sessions: INSERT/SELECT, owner_links: SELECT. 이는 권한 구조 확인이며 live handoff 성공 테스트는 아니다.
- 별도 Supabase inventory에는 `hajunai` 이름의 프로젝트 리소스와 `public.projects`, `public.contexts`, `public.messages` RLS 관련 advisory가 관찰됐다. 그 리소스와 현재 단일 운영 DB의 관계는 확인되지 않았다. 사용자 승인 없이 그 프로젝트에 staging 쓰기나 보안 변경을 하지 않는다.

### 11-2. 브랜치 및 PR 최신 상태

| 항목 | 2026-11-22 확인 상태 | 경계 |
|---|---|---|
| Hajun PR #2 | OPEN. `mes/integration-1` → `feat/corering-handoff-button` (`147f3573ea59eaf9388c4f07c9db71c18ddf9c1e`). | 기존 브랜치를 유지하며 PR base/head는 변경하지 않았다. |
| Hajun 인증 전용 브랜치 | `feat/auth-handoff-main`, base `main` (`4779ad4a41e13ce7ffeee56cb4bbe4cfdbf0ec68`), commit `3eb1fc144831e95f47760e84c3b78005548b808e`. | CoreNull/CoreRing 버튼, Sidebar, `lib/supabaseBrowser.ts` 네 경로만 포함. MES 변경 없음. 새 PR은 만들지 않았다. |
| CoreRing PR #40 | OPEN, `main` base 유지, head `feat/corering-handoff-receive` (`5247763aa2c448b54ffdd1e76c3b9458eb29896e`). | merge 또는 production deploy 없음. |

인증 전용 브랜치에서 `git diff --check`, TypeScript no-emit, 변경 파일 ESLint, Next.js production build를 통과했다. Build는 Supabase 환경변수를 제공하지 않은 채 실행됐고, shared DB 연결·handoff 호출·E2E 쓰기는 없었다. 기존 Hajun PR #2와 CoreRing PR #40은 병합하지 않았다.

브랜치 push 뒤 Vercel이 `feat/auth-handoff-main`의 Preview deployment `dpl_5Bxq6f5SsmmLpJ8hNSAjhPz5Ahmw`를 자동 생성했고 상태는 READY다. 사용자는 Preview 유지와 삭제 금지를 확인했다. Preview 로그인, E2E 및 추가 테스트를 하지 않는다. Production deployment는 실행하지 않았다. Preview 환경이 Production과 분리되었다고 확인되지 않았으므로 테스트 환경으로 사용하지 않는다.

### 11-3. Staging 비용·조건

- Supabase 조직 `mind world`의 현재 plan은 Free이고, 새 project 비용 조회값은 월 `$0`이었다. 단, 공식 Free plan은 Owner/Admin으로 속한 조직 전반에 active project 2개 한도가 있다. 현재 조직 inventory에 active project 두 개가 표시되어 무료 슬롯이 없을 가능성이 있으므로, `$0` 견적만으로 새 프로젝트 생성 가능 여부나 전체 비용을 확정하지 않는다.
- Free plan의 포함량은 DB 500 MB, egress 5 GB, storage 1 GB, 월 50,000 MAU이며, 비활성 Free project는 1주 뒤 pause될 수 있다. Pro는 월 $25부터이고 $10/month compute credit을 포함한다. 사용량 초과, 추가 compute 및 선택한 add-on은 별도 조건으로 과금될 수 있다.
- 현재 staging project는 생성하지 않았다. 새 프로젝트 생성 전 조직 quota와 비용을 다시 조회해 사용자에게 보고하고 별도 명시 승인을 받아야 한다. Google OAuth와 사전 존재하는 Owner 매핑 테스트도 격리 staging에서만 수행한다. 새 Owner 자동 생성/병합은 금지한다.
- 공식 참고: [Supabase Pricing](https://supabase.com/pricing), [Billing](https://supabase.com/docs/guides/platform/billing-on-supabase), [Billing FAQ](https://supabase.com/docs/guides/platform/billing-faq), [Cost Control](https://supabase.com/docs/guides/platform/cost-control), [Compute and Disk](https://supabase.com/docs/guides/platform/compute-and-disk).

### 11-4. 다음 단계와 승인 경계

1. 마스터 문서 기록 이후에도 staging project 생성은 보류한다. quota·예상 비용을 재확인해 사용자 승인을 받은 뒤에만 생성한다.
2. staging이 승인·생성되면 OAuth callback/client 설정, 이미 매핑된 테스트 계정, Vercel Preview의 staging 격리를 확인한다. 그 전에는 Preview 로그인·handoff·E2E를 실행하지 않는다.
3. 격리 staging에서 CoreNull E2E를 먼저, 이어 CoreRing E2E를 수행한다. 공유 운영 DB에는 handoff 또는 테스트 쓰기를 하지 않는다.
4. PR #2와 PR #40은 현재 상태를 유지한다. 병합과 Production 배포는 별도 승인 후 CoreHub → CoreNull/CoreRing → Hajun 순서로만 진행한다.

---
*본 문서는 BRAINPOOL 통합연결 작업의 마스터 기준 문서이며, 새로운 설계 추측이나 원본 문서 변경을 목적으로 하지 않습니다. 다음 작업자는 '미확인 항목'을 참조하여 진행 계획을 수립하시기 바랍니다.*

## 12. 2026-11-22 후속 진행 기록: PR 상태 재확인

2026-11-22에 GitHub PR 메타데이터와 체크 결과를 읽기 전용으로 재확인했다. 두 PR 모두 OPEN이며 base/head는 기존 기록과 일치한다. 이번 확인에서는 PR 수정, 병합, 브랜치 변경 및 배포를 하지 않았다.

| 항목 | 확인 결과 | 체크 결과 | 다음 경계 |
|---|---|---|---|
| Hajun PR #2 | `mes/integration-1` → `feat/corering-handoff-button`, head `147f3573ea59eaf9388c4f07c9db71c18ddf9c1e`, OPEN | Vercel 및 Preview Comments 성공 | CoreRing 수신 PR #40에 의존. Preview 로그인/E2E 및 병합은 실행하지 않음. |
| CoreRing PR #40 | `main` ← `feat/corering-handoff-receive`, head `5247763aa2c448b54ffdd1e76c3b9458eb29896e`, OPEN | brainpool-clean Vercel, corering Vercel 및 Preview Comments 성공 | 체크 성공은 배포 준비 신호일 뿐 인증/handoff 동작 검증이 아님. 병합·Production 배포는 하지 않음. |

체크 정보 출처: [Hajun PR #2](https://github.com/sykim-stack/hajuncore-app/pull/2), [CoreRing PR #40](https://github.com/sykim-stack/brainpool-clean/pull/40). 확인 시각은 2026-11-22 23:52 KST다. 다음 우선 작업은 Hajun/CoreHub Production 환경이 같은 Supabase project ref를 사용하는지 비밀값 노출 없이 확인하는 것이다. 이 값은 GitHub 공개 PR 정보만으로 확정할 수 없으며, Vercel/Supabase 환경 설정을 읽을 권한이 확인되기 전까지 추정하거나 변경하지 않는다.

## 13. 2026-11-22 후속 진행 기록: Production project ref 대조 보류

추천 순서의 다음 단계로 Hajun/CoreHub Production이 같은 Supabase project ref를 사용하는지 확인하려 했으나, 현재 세션에는 Vercel 또는 Supabase 환경 설정을 읽을 수 있는 연결이 확인되지 않았다. GitHub 저장소의 공개 파일만으로 Production에 실제 저장된 URL/ref를 확정할 수 없으므로 이 항목은 **미확인/차단** 상태로 둔다.

- 환경변수 값·비밀키를 요청하거나 출력하지 않았고, 설정을 변경하지 않았다.
- 재개 조건: Vercel/Supabase 읽기 전용 접근을 연결하거나, 각 프로젝트의 Supabase URL에서 project ref 부분만 사용자가 제공한다. 키·토큰·전체 환경변수 값은 공유하지 않는다.
- 다음 확인: Hajun 및 CoreHub Production ref 일치 여부를 대조하고, CoreNull/CoreRing도 같은 운영 DB를 의도하는지 구성 기준과 대조한다. 불일치가 발견되어도 이 문서화 작업의 범위에서는 변경하지 않고 별도 승인 대상으로 기록한다.

## 14. 2026-11-23 후속 진행 기록: Supabase project ref 대조

2026-11-23에 GitHub, Supabase 및 Vercel 연결을 이용해 project ref를 읽기 전용으로 대조했다. 환경변수 값은 키나 토큰을 포함해 비밀값을 출력·저장하지 않았다. Vercel에서 민감(sensitive)으로 지정된 URL 값은 연결 권한상 결과에 포함되지 않아, 해당 서비스의 실제 Production ref를 모두 확정할 수는 없다.

### 확인된 사실

- Supabase 프로젝트 목록에 `Jena-Voca-01` / `grlfocvlfatuvphkyivd`가 `ACTIVE_HEALTHY`로 있고, 별도 `hajunai` / `yqbypcqkgrdyvslzbtid` 프로젝트도 `ACTIVE_HEALTHY`로 존재한다. `sykim-stack's Project` / `loskicxyjrzldfeonall`은 `INACTIVE`로 표시됐다. 별도 `hajunai` 프로젝트가 있다는 사실만으로 이를 staging으로 간주하지 않는다.
- Hajun Vercel 프로젝트의 `NEXT_PUBLIC_SUPABASE_URL`은 `development`, `preview`, `production` 모두 대상으로 설정되어 있고, URL의 ref는 `grlfocvlfatuvphkyivd`였다. Hajun의 공개 Production 페이지에서 내려오는 클라이언트 번들에서도 동일한 ref를 확인했다. 응답 페이지 본문이나 비밀값은 저장하지 않았다.
- CoreNull 저장소의 Supabase linked-project 메타데이터와 `doc/CORENULL_MASTER.md`는 `grlfocvlfatuvphkyivd`를 가리킨다. CoreHub의 설계 문서도 공유 DB ref를 `grlfocvlfatuvphkyivd`로 명시한다.
- Vercel에는 Hajun, CoreNull, CoreHub, CoreRing에 대응하는 프로젝트가 연결되어 있고, 각 프로젝트에 Supabase URL 변수명이 존재한다. 단, CoreNull/CoreHub/CoreRing URL 값은 Vercel에서 민감 값으로 마스킹되어 읽히지 않았다. CoreHub 공개 Production 도메인 및 확인된 배포 URL은 HTTP 404를 반환해 공개 클라이언트 번들로 ref를 대조할 수도 없었다.

### 결론과 후속 경계

Hajun Production 클라이언트 설정은 통합 프로젝트 `grlfocvlfatuvphkyivd`를 사용하는 것이 확인됐다. CoreHub/CoreNull는 저장소의 기준 설정이 같은 ref를 가리키지만, Vercel Production에 실제 저장된 값과의 일치는 아직 검증되지 않았다. 따라서 **Hajun ↔ CoreHub Production ref 일치 여부는 부분 확인/미확인**으로 유지한다. 환경변수를 변경하거나 운영 DB에 접속·쓰기하지 않았다.

재개 방법은 서비스 프로젝트의 Supabase URL에서 ref 부분만 읽을 수 있는 비밀값 비노출 권한을 제공하거나, 각 서비스별 Production Supabase URL이 `grlfocvlfatuvphkyivd`인지 담당자가 대조해 알려주는 것이다. 전체 URL, API key, 토큰은 공유하지 않는다. 확인이 끝날 때까지 운영 환경을 대상으로 handoff/E2E 테스트를 하지 않는다.

## 15. 2026-11-23 사용자 결정: 로그인은 연결 검증용 수단

**로그인은 연결을 위한 수단이지, BRAINPOOL의 사용자 경험이 아니다.** 이 원칙에 따라 Google 로그인 UI는 Hajun과 CoreHub/CoreNull/CoreRing 사이 인증 연결을 검증하기 위한 내부·임시 도구로만 취급한다.

- Google 로그인 UI를 외부 사용자용 제품 UI로 다듬지 않는다.
- 일반 사용자의 기본 경험에 로그인이나 계정 생성을 추가하지 않는다.
- Google OAuth 및 Supabase `access_token`은 현재 연결 작업의 인증 수단으로만 제한한다.
- Owner 식별과 권한 확인은 기존 BRAINPOOL 식별 체계를 존중한다.
- 이번 결정으로 인증 구조나 운영 DB를 변경하지 않는다.
- 인증 구조 변경은 별도 기획과 승인 대상으로 둔다.

이 항목은 사용자 확정 결정이다. UI/안내 문구에만 적용하며, 로그인 제공 여부나 인증 구조를 확장하는 근거로 해석하지 않는다.

## 16. 후속 설계 제안: `owner_link_required` 안전한 처리

**상태: 제안, 코드 변경·운영 Owner 변경 없음.** 기존 원칙인 자동 Owner 생성·병합 금지와 일반 사용자 로그인 비노출을 유지하려면 다음 UX가 안전하다.

1. 409 `owner_link_required`를 받으면 handoff를 중단하고, “현재 인증된 계정에 연결된 기존 BRAINPOOL Owner를 확인할 수 없습니다. 데이터는 변경하지 않았습니다.”와 같은 중립적 안내를 표시한다.
2. 계정 생성, Owner 자동 생성·병합, 다른 Google 계정 사용 유도는 기본 경로로 제공하지 않는다.
3. Owner 식별이 필요한 경우 기존 BRAINPOOL 수동 확인 절차로 넘기되, 확정된 절차가 문서화되기 전에는 새 연결이나 DB 쓰기를 하지 않는다.
4. 오류 화면이나 로그에 다른 계정의 Google 식별자, Owner key, 집 이름 등 개인/소유 정보가 노출되지 않게 한다.
5. 완료 조건은 오류 시 연결이 안전하게 멈추고 기존 화면으로 돌아갈 수 있는 안내가 정해지는 것이다. E2E/운영 테스트는 격리 환경 승인 후에만 한다.

이 제안은 사용자에게 일반 로그인 흐름을 추가하지 않는다. 제품 화면에 적용하거나 수동 Owner 연결을 실행하려면 별도 승인과 기존 식별 체계 확인이 필요하다.

## 17. 후속 설계 제안: Owner identity와 로컬스토리지

**상태: 권고안, 코드 변경 없음.** `localStorage.corenull_owner_key`는 사용자 브라우저 상태에 따라 달라질 수 있으므로 인증 또는 권한의 근거로 사용하지 않는다. 인증된 ticket 결과와 서버의 기존 identity 매핑을 권한 판단의 기준으로 유지하고, 로컬 값이 그 결과와 다르면 조용히 권한에 채택하지 않는다. 기존 앱 기능상 로컬 값의 동기화·삭제가 필요하더라도 영향 범위를 먼저 확인하고 별도 승인 후 변경한다. 로그인 전 일반 사용자 흐름에서 계정 선택이나 Owner 복구를 요구하는 UI를 추가하지 않는다.

다음 담당자는 먼저 기존 코드가 이 원칙과 다른 권한 판단을 하는지 읽기 전용으로 점검한다. 발견 사항은 파일/경로와 근거를 적되, 데이터 정리·Owner 매핑 변경은 수행하지 않는다.

## 18. 2026-11-23 읽기 전용 코드 점검: Owner identity 경로

점검 기준 HEAD: `hajuncore-app` `4779ad4`, `brainpool-clean` `41b293a`, `brainpool-corenull` `2888653`, `brainpool-corehub` `932cd90`. 코드는 읽기만 했고 테스트, DB 조회/쓰기, 브랜치 수정은 하지 않았다.

- Hajun 코드에서 `corenull_owner_key` localStorage 사용은 찾지 못했다.
- CoreNull `lib/ownerKey.ts`는 기존 `corenull_owner_key`를 우선 반환하고, 값이 없을 때 legacy `corenull_device_id`를 기존 사용자 호환 목적으로 승격한다. 새 UUID 생성은 별도 `createOwnerKey()`에서 명시적으로 호출될 때만 일어난다. 이 legacy 동작은 BRAINPOOL 기존 소유자 식별 체계와 데이터 보존에 연결되므로 별도 검토·승인 없이 변경하지 않는다.
- CoreNull `lib/identity/resolveCoreNullOwnerFromToken.mjs`는 인증된 Supabase `auth_user_id`를 기존 `corenull_owner_identities`에 조회한다. 매핑이 없으면 `owner_link_required`, 조회 오류면 `owner_mapping_unavailable`로 실패한다. handoff 화면 `app/auth/handoff/page.tsx`는 오류 응답에서만 안내를 표시하고, 성공 응답에 기존 `owner_key`가 있을 때 `setOwnerKey()`를 호출한다. 따라서 확인된 코드 경로상 409 처리에서 Owner 값을 저장하지 않는다. 메시지는 Owner ID나 다른 계정의 세부 식별자를 포함하지 않으며, 새 Owner 생성/자동 병합을 하지 않았다고 안내한다.
- CoreHub `lib/corehub/resolveOwnerKeysFromBearer.mjs`는 client-supplied `owner_key`를 신뢰하지 않는다고 명시하고, 인증 principal의 `auth_user_id`로 활성 `auth_owner_links`를 조회한다. `app/api/corehub/opportunities/route.js`도 Owner 필드 클레임을 거부하고 Bearer/session principal에서 scope를 구한다.
- 반면 CoreRing `app/page.tsx`는 `localStorage.corenull_owner_key`를 읽어 `x-owner-key` 요청 헤더로 전달한다. 이것만으로 실제 서버 측 권한 우회가 확인된 것은 아니다. 발견된 CoreHub opportunities 경로는 owner scope를 인증 principal에서 resolve하지만, CoreRing의 모든 API route가 같은 검증을 하는지 아직 route-by-route로 확인하지 않았다.

### 다음 작업과 변경 금지선

1. CoreRing에서 `authHeaders()`가 호출되는 각 API 경로를 대응 서버 라우트까지 추적한다. 각 라우트가 identity·권한을 서버에서 검증하는지 기록한다.
2. 인증 검증 없이 `x-owner-key`, query/body의 `owner_key`, 또는 device ID만으로 Owner 범위 데이터를 반환·수정하는 경로가 있는지 확인한다. 발견해도 현 task에서는 수정하지 않고 파일/경로·근거·영향 범위를 정리해 별도 승인 대상으로 제시한다.
3. CoreNull의 legacy device→Owner 호환, existing Owner mapping 및 user data는 삭제·병합·재할당하지 않는다.

## 19. 후속 작업 보드: 2026-11-23 기준

- [x] Hajun PR #2와 CoreRing PR #40의 상태 및 CI를 읽기 전용 확인. 둘 다 OPEN이며 병합/배포 없음.
- [~] Hajun/CoreHub/CoreNull/CoreRing Supabase ref 대조. Hajun Production 클라이언트 `grlfocvlfatuvphkyivd` 확인. CoreHub/CoreNull/CoreRing Vercel Production URL 변수는 민감 값으로 응답되지 않아 완전한 일치 여부 미확인.
- [x] 로그인 제품 방향 확정. Google OAuth/access token은 연결 검증용 내부·임시 수단이며, 일반 사용자 기본 경험에 로그인·계정 생성을 추가하지 않음.
- [x] 409 `owner_link_required`의 코드상 기존 안내 확인. 오류는 연결을 거부하고 Owner 자동 생성·병합을 하지 않음. 별도 UI 변경은 없음.
- [~] localStorage/Owner 관계 조사. CoreNull의 legacy 정체성 보존 동작은 유지 대상. CoreRing에서 localStorage owner key를 header로 전달하는 경로는 API별 서버 권한검증 추가 점검 필요.
- [ ] CoreRing handoff 격리 검증 계획·API route 권한 검토 완료 후 별도 승인. PR #2/#40은 그대로 두고 운영 E2E·병합·배포 금지.
- [ ] Staging project가 현재 Supabase 프로젝트 목록에 존재하지 않는다고 단정할 수 없음. 별도 `hajunai` project를 staging으로 간주하지 않는다. 격리·비용·quota 재확인 및 승인 전에는 운영 DB 쓰기 테스트 금지.
