# BRAINPOOL 통합연결 작업 마스터 문서

**작성일**: 2026-11-22  
**최종 갱신**: 2026-11-23 (원문 §§1–42 보존, 완료·미완료 판정 §43 추가)
**목적**: 지금까지 분석한 전체 레포와 연결 구조를 하나의 작업 기준 문서로 통합 (새 설계·구현 없음)
**범위**: HajunAI ↔ CoreNull 인증 연결 (CoreRing은 별도 보류)
**기반**: `hermes-work-boundaries` 원칙 및 관측된 사실 기록

---

## 1. 전체 프로젝트 및 레포 구성

| 레포/프로젝트 | 주요 내용 | Production 배포 상태 |
| --- | --- | --- |
| **brainpool-corehub** | CoreHub API (handoff 발급·교환, opportunities API, auth 라우트) | `main`, 커밋 `932cd90` 배포됨. `docs/sql/2026-11-21_auth_handoff_tables.sql` 실행됨. |
| **brainpool-corenull** | CoreNull 앱 `corenull.vercel.app`), Google 로그인·owner_key 매핑, `/auth/handoff` 처리 | `main`, 커밋 `2888653` 배포됨. Google `sub`+Supabase Auth User ID를 기존 Owner에 연결하는 코드 배포됨. |
| **brainpool-clean** | CoreRing 연동 관련 구성 포함 (handover 로직은 아님) | `main` 상태, handoff 버튼 미배포. |
| **hajuncore-app** | HajunAI 클라이언트 `hajuncore-app.vercel.app`), CoreNull·CoreRing 버튼, 대시보드 | `mes/integration-1` 브랜치`9ebe3c6`) 배포됨. CoreNull handoff 경로 포함. |
| **hermes-agent** (메스) | 작업 원칙·스킬 관리 `hermes-work-boundaries` 등) | 로컬 스킬 디렉터리에 저장. |

> **공통 프로젝트**: Supabase 프로젝트 `grlfocvlfatuvphkyivd` 공용 사용 (Shared Supabase Auth 기반 Path S 경로).

---

## 2. 각 서비스의 역할과 책임 경계

| 서비스 | 핵심 책임 | 주의/제한 사항 |
| --- | --- | --- |
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
| --- | --- | --- | --- |
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
| --- | --- |
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
| --- | --- | --- | --- | --- |
| **brainpool-corehub** | `main` | `932cd90` | Production 배포됨 | `mes/integration-1` → `9ebe3c6` merged |
| **brainpool-corenull** | `main` | `2888653` | Production 배포됨 (Google 매핑 코드) | - |
| **hajuncore-app** | `mes/integration-1` | `9ebe3c6` | Production 배포됨 (CoreNull 버튼 포함) | - |
| **brainpool-clean** | `main` | `1995609` | handoff 미배포 (보류) | - |

> **핵심 커밋 요약**:- `2fa1882`: CoreHub 발급·교환 API 최초 도입.- `13bbcaf`: CoreNull redeem + Owner 링크.- `1995609`: CoreNull redeem (Owner 변경 없음).- `b5c8220`: Hajun CoreNull handoff 라우트 + 버튼 배포.- `932cd90`: CoreHub exchange 및 SQL 마이그레이션.- `e556ee9`: Opportunities Bearer 스코프 정리.- `4779ad4`: Hajun handoff proxy + 버튼 + Sidebar.

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

1. **Owner 매핑 불일치**:
원인: `localStorage.corenull_owner_key`가 브라우저 상태에 따라 다른 Owner 영향.
해결: DB identity 매핑`corenull_owner_identities`) 우선 원칙.

1. **두 Google 계정 다른 Owner 소유**:
사실: Google `…4026` → Owner `47c7…`, Google `…7501` → Owner `e35f…`.
영향: 계정 간 Owner 공유 불가 확인.

1. **SNL 집 별도 Owner 소유**:
사실: `f0bce18b` Owner 아래 `SNS 어린이 수` 집 존재. 메인 Owner `47c7…`과는 분리됨.

1. **CoreRing 미검증**:
상태: CoreNull 검증 완료 후 별도 진행 예정.

### 7-2. 미완료 작업 (Deferred)

- Hajun 세션 전제 점검 후 최종_flow 검증 (이미 Path S로 해결됨).

- CoreRing handoff 별도 진행.

- identity/로컬스토리지 이슈 추가 정리 (필요 시).

---

## 8. 전체 통합 작업 순서

1. **전제 확인**: Same Supabase project? Google login 허용 여부?

1. **SQL 실행**: `docs/sql/2026-11-21_auth_handoff_tables.sql` 적용 (이미 수행됨).

1. **환경변수 설정**: 4개 프로젝트 `COREHUB_API_URL` 등 (이미 수행됨).

1. **Hajun Google login 추가**: client-side Auth 추가, 버튼 상태 분기 (이미 수행됨).

1. **Hajun 버튼 수정**: 로그인 여부 판별 후 `Authorization: Bearer *** 헤더 주입 (이미 수행됨).

1. **CoreHub·CoreNull 검증**: 이미 동작하는 코드 경로 확인 (이미 수행됨).

1. **스모크 테스트**: 정상 ticket → cookie 설정, 만료/재사용 → 에러, owner 링크 없음 → 409 (이미 확인됨).

1. **CoreRing 분리**: CoreNull 검증 완료 후 별도 진행.

1. **작업 종료**: 이상 없음 → 마스터 문서 최종 확정.

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

- [ ] **SNL 집 ****`f0bce18b`**** identity 매핑** 추가 조회 (별도 SQL 실행 필요).

- [ ] **브라우저 로컬스토리지 정리**에 대한 최종 권고안 작성 (이미 `localStorage.corenull_owner_key` 영향 인지済).

> **위 미확인 항목은 다음 작업 이어가기 전, 담당자가 확인 후 체크리스트에 반영하거나 보류 결정**해야 합니다.
**기존 원본 문서 수정·삭제, 설계 임의 변경은 금지**됩니다.

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
| --- | --- | --- |
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

1. staging이 승인·생성되면 OAuth callback/client 설정, 이미 매핑된 테스트 계정, Vercel Preview의 staging 격리를 확인한다. 그 전에는 Preview 로그인·handoff·E2E를 실행하지 않는다.

1. 격리 staging에서 CoreNull E2E를 먼저, 이어 CoreRing E2E를 수행한다. 공유 운영 DB에는 handoff 또는 테스트 쓰기를 하지 않는다.

1. PR #2와 PR #40은 현재 상태를 유지한다. 병합과 Production 배포는 별도 승인 후 CoreHub → CoreNull/CoreRing → Hajun 순서로만 진행한다.

---

*본 문서는 BRAINPOOL 통합연결 작업의 마스터 기준 문서이며, 새로운 설계 추측이나 원본 문서 변경을 목적으로 하지 않습니다. 다음 작업자는 '미확인 항목'을 참조하여 진행 계획을 수립하시기 바랍니다.*

## 12. 2026-11-22 후속 진행 기록: PR 상태 재확인

2026-11-22에 GitHub PR 메타데이터와 체크 결과를 읽기 전용으로 재확인했다. 두 PR 모두 OPEN이며 base/head는 기존 기록과 일치한다. 이번 확인에서는 PR 수정, 병합, 브랜치 변경 및 배포를 하지 않았다.

| 항목 | 확인 결과 | 체크 결과 | 다음 경계 |
| --- | --- | --- | --- |
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

1. 계정 생성, Owner 자동 생성·병합, 다른 Google 계정 사용 유도는 기본 경로로 제공하지 않는다.

1. Owner 식별이 필요한 경우 기존 BRAINPOOL 수동 확인 절차로 넘기되, 확정된 절차가 문서화되기 전에는 새 연결이나 DB 쓰기를 하지 않는다.

1. 오류 화면이나 로그에 다른 계정의 Google 식별자, Owner key, 집 이름 등 개인/소유 정보가 노출되지 않게 한다.

1. 완료 조건은 오류 시 연결이 안전하게 멈추고 기존 화면으로 돌아갈 수 있는 안내가 정해지는 것이다. E2E/운영 테스트는 격리 환경 승인 후에만 한다.

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

1. 인증 검증 없이 `x-owner-key`, query/body의 `owner_key`, 또는 device ID만으로 Owner 범위 데이터를 반환·수정하는 경로가 있는지 확인한다. 발견해도 현 task에서는 수정하지 않고 파일/경로·근거·영향 범위를 정리해 별도 승인 대상으로 제시한다.

1. CoreNull의 legacy device→Owner 호환, existing Owner mapping 및 user data는 삭제·병합·재할당하지 않는다.

## 19. 후속 작업 보드: 2026-11-23 기준

- [x] Hajun PR #2와 CoreRing PR #40의 상태 및 CI를 읽기 전용 확인. 둘 다 OPEN이며 병합/배포 없음.

- [~] Hajun/CoreHub/CoreNull/CoreRing Supabase ref 대조. Hajun Production 클라이언트 `grlfocvlfatuvphkyivd` 확인. CoreHub/CoreNull/CoreRing Vercel Production URL 변수는 민감 값으로 응답되지 않아 완전한 일치 여부 미확인.

- [x] 로그인 제품 방향 확정. Google OAuth/access token은 연결 검증용 내부·임시 수단이며, 일반 사용자 기본 경험에 로그인·계정 생성을 추가하지 않음.

- [x] 409 `owner_link_required`의 코드상 기존 안내 확인. 오류는 연결을 거부하고 Owner 자동 생성·병합을 하지 않음. 별도 UI 변경은 없음.

- [x] localStorage/Owner 관계 정적 점검. CoreNull의 legacy 정체성 보존 동작은 유지 대상. CoreRing `authHeaders()` 7개 호출 위치를 대응 API handler까지 추적했으며 세부 결과는 §20 참조. 외부 identity·배포계층·DB 정책은 미확인.

- [~] CoreRing API route 정적 권한 검토 완료 (§20). Handoff 격리 검증은 계획 수립·별도 승인 후 진행. PR #2/#40은 그대로 두고 운영 E2E·병합·배포 금지.

- [x] Supabase 목록에서 별도 `hajunai` active project를 확인하고 데이터 inventory를 읽기 전용으로 수행 (§21). 이를 staging으로 간주하지 않으며 삭제하지 않음.

- [ ] 격리 staging project의 존재·비용·quota 상태는 별도 재확인 필요. 승인 전 운영 DB 쓰기 테스트 금지.

## 20. 2026-11-23 읽기 전용 점검: CoreRing `authHeaders()` API 경로

`brainpool-clean` 정적 코드 점검본 기준 커밋은 `41b293a`다. `app/page.tsx`의 `authHeaders()` 사용 위치 7곳을 각각 대응하는 API handler까지 추적했다. 저장소 코드만 읽었으며 네트워크/API 요청, 테스트, Supabase 조회·쓰기, 코드 수정, PR 변경·병합 및 배포는 하지 않았다.

### 호출 경로별 관찰

| UI 호출 | 서버 경로 | 정적 코드에서 확인한 처리 |
| --- | --- | --- |
| `app/page.tsx:241` | `GET /api/chat/rooms` | `app/api/chat/rooms/route.ts:4-17`는 요청 identity를 읽거나 검증하지 않고 공개 방 목록을 조회한다. `x-device-id` 및 선택적 `x-owner-key`가 전송돼도 이 handler에서는 권한 근거로 사용되지 않는다. |
| `app/page.tsx:303` | `POST /api/chat`, `action=poll` | `route.ts:295-302`에서 principal과 방 읽기 검사를 요구한다. `lib/security/principal.ts`는 caller-provided header의 형식만 검사한다. `lib/security/room-access.ts`는 비공개 방에서 DB 소유자/참여자와 대조하고, 공개 방은 유효 형식 principal의 읽기를 허용한다. |
| `app/page.tsx:364` | `POST /api/chat`, `action=send` | body `userId`와 principal 식별자를 비교하고 방 쓰기 권한을 검사한다. 공개 방은 비서비스 principal의 쓰기를 허용하며, 비공개 방은 DB 소유자/참여자 확인을 거친다. principal header 값이 실제 사용자/기기에 결속됐는지는 이 handler와 helper의 형식 검사만으로 확인되지 않는다. |
| `app/page.tsx:389` | `POST /api/brainpool` | 번역 경로에서 사용자 인증·소유권 검증은 코드상 확인되지 않았다. body `device_id` 또는 `x-device-id`가 CoreHub fact의 `owner_key`로 전달될 수 있고, `x-owner-key`는 이 handler에서 검증되지 않는다. CoreHub 수신 측의 검증·권한 효과는 미확인이다. |
| `app/page.tsx:487` | `DELETE /api/chat/rooms/{roomId}` | principal 식별자를 DB `owner_device_id`와 비교하고, 엔진도 동일성을 확인한다. 그러나 `deviceId`는 caller-provided header에서 형식 검사된 값이다. `x-owner-key`는 이 삭제 경로의 owner 비교를 대체하지 않는다. |
| `app/page.tsx:578` | `POST /api/chat`, `action=clear` | 이 handler에는 `clear` 분기가 없어 `unknown action`으로 처리되며 삭제 handler를 호출하지 않는다. 별도 구현된 clear 경로는 `PATCH /api/chat/rooms/{roomId}`이고, DB 소유자 대조와 엔진의 동일성 확인을 수행한다. |
| `app/page.tsx:611` | `POST /api/chat`, `action=create` | create 분기는 `getPrincipal()` 또는 권한 검사를 호출하지 않고 body의 `createdBy`를 `CREATE_ROOM`에 전달한다. 이 분기에서 요청 identity를 인증 근거로 검증한다는 코드는 확인되지 않았다. 실제 저장 효과 및 배포 환경의 외부 보호 여부는 미검증이다. |

`authHeaders()`는 `localStorage.corenull_owner_key` 값이 있으면 `x-owner-key`로, 클라이언트의 `deviceId`는 `x-device-id`로 전송한다 (`app/page.tsx:70-85`). `x-owner-key`가 전송된다는 사실 자체는 인증이나 권한 우회 증거가 아니다. 여러 채팅 경로의 principal은 caller-provided header를 바탕으로 구성되고 형식 검사를 거치지만, 저장소의 이 코드만으로 session/token 또는 cryptographic proof와의 결속은 확인되지 않았다.

### 결론과 다음 담당자 경계

- 이 정적 검토만으로 실제 무단 접근·삭제·데이터 노출, 운영 환경의 악용 가능성 또는 확정된 취약성을 주장하지 않는다. 공개 방에 대한 접근은 관찰된 코드 정책이며, 비공개 방·삭제 경로에는 저장된 소유자/참여자 비교가 있다.

- 반면 공개 방 목록, `/api/brainpool` 번역 및 chat `create` 경로에서는 각 handler가 요청 identity를 인증 근거로 검증하지 않거나 사용하지 않는 코드가 확인됐다. 특히 create의 `createdBy`는 요청 body에서 직접 전달된다. 이 발견만으로 생성의 실질적 부수효과나 배포 노출을 확정하지 않는다.

- 후속 읽기 전용 검토 후보: 배포 middleware/proxy와 identity 헤더 발급·전달 경로, 관련 DB RLS/정책, CoreHub facts 수신 handler 및 `CREATE_ROOM`의 저장·부수효과. 해당 검토 전까지 영향 범위는 미확인으로 둔다.

- 발견 사항을 이유로 코드를 수정하거나 Owner/DB 데이터를 변경하지 않는다. 격리 환경 승인 전 handoff/E2E 실행, PR #2/#40 병합 및 Production 배포도 하지 않는다.

> **다음 세션 시작점**: 우선 이 절의 세 후속 읽기 전용 검토 후보를 조사한다. 결과를 마스터 문서와 체크리스트에 누적하고, 실제 동작 검증이나 수정은 별도 승인 경계로 유지한다.

## 21. 2026-11-23 읽기 전용 검토: 별도 Supabase `hajunai` 프로젝트

Supabase 프로젝트 목록과 데이터 inventory를 읽기 전용으로 확인했다. `hajunai`는 `ap-southeast-2` 리전에 있는 `ACTIVE_HEALTHY` 별도 프로젝트이며 현재 staging으로 간주하지 않는다. 이 저장소는 **PUBLIC**이므로 프로젝트 ref, 세부 테이블 보안 설정, remediation 세부사항은 이 문서에 기록하지 않는다.

### 데이터와 용량 관찰

- 앱 테이블에는 프로젝트 항목 6건과 기술 컨텍스트 6건이 있다. 메시지, 문서, memory_store, Supabase Auth 사용자 및 Storage object는 각 0건이다. Supabase custom migration 목록과 Edge Function 목록은 비어 있다.

- 컨텍스트는 단순 빈 placeholder가 아니라 여러 Brainpool 제품 모듈의 기술 요약·최근 작업 메모를 담는다. 최신 컨텍스트 갱신은 2026-03-07이다. 원문 본문은 공개 문서에 복사하지 않았다. 데이터가 적다는 이유만으로 고유한 프로젝트 기록이 불필요하다고 단정하지 않는다.

- SQL의 `pg_database_size` 읽기 결과는 `hajunai` 약 12.55 MB, 통합 운영 프로젝트 `Jena-Voca-01` 약 514.60 MB였다. 화면에는 Free 사용량 530/500 MB가 보인다. 두 활성 프로젝트 합은 약 527.15 MB이므로 `hajunai`만 삭제해도 사용량 초과가 해소된다고 볼 수 없으며, paused project의 용량은 확인하지 않았다.

- 기존 Hajun Production 확인 결과는 통합 ref `grlfocvlfatuvphkyivd`를 사용한다. 네 대상 저장소의 추적 가능한 파일에서 `hajunai` project ref 문자열은 찾지 못했다. 이 확인은 비추적 배포 설정이나 외부 사용자 사용 여부까지 배제하지 않는다.

### 보안·삭제 경계

- 별도 프로젝트에 critical Supabase 보안 advisory가 관찰됐다. 구체적 프로젝트 ref·테이블·정책과 수정 SQL은 이 공개 저장소에 노출하지 않고 소유자에게 별도로 전달한다. 어떠한 보안 설정도 변경하지 않았다.

- 사용자는 해당 DB를 삭제 후보로 보도록 했으나, 이 검토 시점에는 영구 삭제·일시정지·데이터 수정·export/backup을 하지 않았다. 6개 컨텍스트의 보존 가치와 전체 프로젝트 삭제 범위를 명확히 한 뒤 사용자 확인을 받아야 한다.

- `hajunai` 삭제는 현재 용량 초과를 단독으로 해결하지 못할 가능성이 높다. 프로젝트 삭제를 선택한다면 project 이름·region·ref를 다시 대조하고, 삭제 전 6개 컨텍스트가 필요한지 결정한다. 보존을 선택한다면 access-control remediation은 별도 정책 설계와 승인 대상으로 둔다.

> **다음 세션 시작점**: 사용자에게 `hajunai` 전체 프로젝트 영구 삭제 여부를 물어보고, 승인 전에는 어떠한 destructive action도 수행하지 않는다. 공개 저장소에는 위에 표시한 제한된 분석만 보관하고 보안 세부사항은 비공개로 유지한다.

## 22. 2026-11-23 읽기 전용 검토: CoreHub facts 및 CoreRing room-create 경로

점검 기준 HEAD: `brainpool-corehub` `932cd90`, `brainpool-clean` `41b293a`. 이 절은 저장소 코드 정적 검토 결과다. API 요청·테스트·DB 조회/쓰기·환경변수 열람·코드/설정 변경·PR 변경/병합·배포는 하지 않았다. 공개 저장소에 비밀값이나 DB 정책의 세부 내역을 기록하지 않는다.

### CoreRing → CoreHub facts

- CoreRing `app/api/brainpool/route.ts:108-123`은 요청 body `device_id`, 요청 `x-device-id`, 또는 임의 fallback 값을 `owner_key`로 facts 전송 객체에 넣는다. 이 경로에서 `x-owner-key`를 인증된 principal로 확인하는 동작은 관찰되지 않았다.

- `lib/corehub.ts:38-44`의 POST helper는 JSON `Content-Type`만 설정해 `/api/corehub/facts`에 전송한다. 해당 호출 코드에는 Authorization/Bearer나 별도 인증 증명을 전달하는 부분이 보이지 않는다.

- CoreHub `app/api/corehub/facts/route.js:10-15,27-37`은 GET/POST method를 분기하고 POST body의 필수 필드 존재 여부를 확인한 다음 DB 클라이언트를 불러온다. handler 및 `handlePost`에는 principal/token 인증을 확인하는 코드가 보이지 않는다. `:70-93`은 body의 `owner_key`를 포함한 Fact를 저장하고 후속 connection detection을 시작한다.

- 같은 파일 `:96-120`의 GET은 `owner_key` query가 있으면 필터로 적용하지만 선택 사항이며, 없으면 해당 필터 없이 limit 범위의 facts를 조회한다. 코드 정적 관찰만으로 외부에서 실제 데이터가 반환되는지, Vercel 보호나 DB 정책이 추가 차단하는지 확인하지 못했다.

- CoreHub `lib/supabase.ts:9-18`은 `SUPABASE_SERVICE_ROLE_KEY`가 있으면 이를 `SUPABASE_KEY`보다 우선해 서버 클라이언트에 사용한다. 이는 서버 환경 설정 시 service-role 권한이 적용될 수 있다는 코드 경로를 뜻하며, 실제 Production 환경변수 값이나 DB RLS/grants/policies를 확인한 것은 아니다.

### CoreRing chat room 생성

- `app/api/chat/route.ts:322-329`의 `action=create`는 `getPrincipal()`이나 room authorization 검사 호출 없이 요청 body의 `createdBy`를 사용하고, 없으면 `anonymous`를 지정한다. `isPublic`의 기본값은 `true`다.

- `brain-engine/engines/chat/room.js:22-29`는 해당 `createdBy` 값을 `owner_device_id` 및 metadata에 저장한다. `brain-engine/connectors/storage.js:9-20`은 서버 환경의 `SUPABASE_SERVICE_ROLE_KEY`로 Supabase 클라이언트를 생성한다.

- 이는 사용자 제공 식별자가 room 생성자의 값으로 저장될 수 있다는 정적 근거다. 이 검토로 실제 무단 room 생성, 공개 배포 도달성, 악용, 또는 DB에 대한 결과를 확인한 것은 아니다.

### 배포 계층 증거와 미확인 사항

- CoreRing `proxy.ts:4-14`는 API 요청에 trace ID를 설정·기록하고 그대로 진행시키며, 인증 검증 코드는 관찰되지 않았다. `next.config.ts`에는 이 검토 범위에서 rewrites 설정이 없고, `vercel.json`에는 cache-control header만 있다.

- CoreHub 저장소에서는 이번에 확인한 범위에서 middleware/proxy 또는 `vercel.json` 파일을 찾지 못했고 `next.config.mjs`는 빈 설정이다. 이는 Vercel Dashboard의 deployment protection, access control, 환경 설정 또는 DB 권한 정책이 없다는 증거가 아니다. 해당 외부 설정은 확인하지 않았다.

- CoreRing의 요청 header가 실제 사용자·기기에 cryptographic/session credential로 결속되는지, CoreHub facts endpoint에 플랫폼 차원의 보호가 있는지, facts schema의 RLS·grants·policies가 어떻게 설정돼 있는지는 미확인이다.

### 우선 권고 및 안전 경계

1. 우선순위 1: CoreHub facts POST/GET에 허용된 service-to-service 인증과 서버 측 owner scope 검증이 있는지, 배포 설정 및 실제 DB 권한을 비밀값을 노출하지 않는 읽기 전용 증거로 확인한다. `owner_key`는 식별자이지 인증 증명이 아니므로 요청 body/query 값만으로 인증·권한을 부여하지 않는 원칙을 유지한다.

1. 우선순위 2: CoreRing room create의 공개 기본값, 허용된 creator principal, 생성 권한과 abuse-control 요구사항을 제품/보안 담당자와 결정한다. `createdBy` 또는 `deviceId`를 증명된 principal로 취급하지 않는다.

1. 우선순위 3: 각 handler의 예상 인증 모델을 API 계약과 맞춘 뒤 수정안을 별도로 제안하고, 격리 환경에서 검증한다. 이 문서화 작업은 구현 변경·DB/RLS 변경·요청 replay·운영 테스트·배포를 승인하지 않는다.

1. 실제 동작 확인이나 코드 수정은 별도 범위·승인 대상으로 남긴다. Hajunai DB에 대한 삭제·정지·보안 변경은 헤르메스 전체 DB 조사 결과와 별도 사용자 결정 전까지 계속 보류한다.

> 본 절은 이전 §19 작업 보드 및 §20의 후속 검토 항목을 최신 정적 점검 결과로 보충한다. 정적 코드 관찰은 실제 노출·취약성 exploit의 입증과 동일하지 않으며, 플랫폼 보호 및 DB 정책 확인 전까지 영향은 미확정이다.

## 23. 2026-11-23 읽기 전용 점검: CoreHub Production 보호 설정 및 facts DB 권한

§22의 첫 번째 후속 권고에 따라 Vercel 프로젝트 설정과 통합 Supabase의 catalog metadata만 읽기 전용으로 확인했다. CoreHub Production deployment metadata는 `brainpool-corehub` 저장소 `main`의 `932cd90` commit을 가리키고 상태는 `READY`였다. API endpoint 호출, 환경변수 값 복호화/열람, DB row 조회, 쓰기, 설정 변경은 하지 않았다. 이 PUBLIC 문서에는 URL, deployment/project ID, Supabase ref 및 정책 SQL 전문을 싣지 않는다.

### 확인된 보호·권한 상태

- Vercel primary CoreHub Production project의 설정 조회 결과 password protection, SSO protection, trusted-IP protection이 모두 비활성으로 표시됐다. 별도의 유사 이름 프로젝트는 SSO protection 설정이 다르지만 custom domain은 예외로 표시되어, 해당 프로젝트가 같은 API 경로를 보호한다고 간주하지 않는다. 실제 네트워크/API 요청은 하지 않았으며, Vercel 외부 프록시나 추가 perimeter control의 존재는 확인하지 않았다.

- Supabase catalog 조회 대상의 `corehub.facts`는 RLS enabled, FORCE RLS disabled였다. `anon` 및 `authenticated` 역할의 직접 SELECT/INSERT table privilege는 없고, `service_role`의 SELECT/INSERT privilege는 있었다. `anon`/`authenticated` 대상으로 모든 command에 적용되는 restrictive policy의 USING 및 WITH CHECK 표현식은 false였다. 이는 해당 DB 테이블에 대한 직접 클라이언트 접근이 차단됨을 보여 주지만 서버 API를 통한 접근 여부를 판정하지 않는다.

- CoreHub 코드 `lib/supabase.ts`는 `SUPABASE_SERVICE_ROLE_KEY`가 설정돼 있으면 이를 우선 사용한다. service-role 권한은 일반 클라이언트의 RLS 차단과 다른 신뢰 경계다. Vercel Production에 실제 저장된 key 종류와 Supabase target ref는 이 점검에서 확인하지 않았으므로, 위 catalog 결과를 해당 배포의 런타임 DB로 확정 연결하지 않는다.

- 배포 코드의 `GET /api/corehub/facts`는 `owner_key` query가 선택 사항이고, POST/GET handler에서 애플리케이션 principal 인증 확인은 코드상 보이지 않는다는 정적 관찰(§22)은 그대로 유효하다. Vercel 프로젝트의 보호 flag 비활성 결과와 합치면 노출 위험 우려가 커지지만, endpoint에 요청하지 않았으므로 외부 비인증 호출 가능성이나 실제 데이터 노출은 확인된 사실로 단정하지 않는다.

### 판단 및 다음 단계 경계

1. 현재 증거는 **Potential high risk / runtime exposure unverified**로 분류한다. DB의 직접 anon/authenticated 권한 부재만으로 API가 보호된다고 볼 수 없고, 반대로 공개 접근 가능성도 API 호출 없이 확정하지 않는다.

1. 다음 단계는 코드/DB 변경이 아니라, 소유자가 비공개 운영 채널에서 Vercel Production의 Supabase URL ref와 key 종류를 비밀값 자체를 노출하지 않는 방식으로 확인하는 것이다. ref 비교는 앞서 확인한 통합 운영 ref와 일치 여부만 기록하고 전체 URL이나 key는 공유·문서화하지 않는다.

1. 위험 완화 조치(배포 보호, handler 인증, service credential 교체, DB 권한/RLS 수정)는 별도 설계·승인 후 진행한다. 정책 없는 RLS 변경, 추측에 의한 key 교체, 운영 API 테스트, 운영 데이터 접근은 수행하지 않는다.

1. 유사 이름의 보조 Vercel 프로젝트가 primary의 보호 수단이라고 가정하지 않는다. 해당 프로젝트의 배포·custom domain과 CoreHub API 경로 연결 여부는 미확인으로 남긴다.

> 본 절은 읽기 전용 설정·catalog 결과이며 실제 endpoint 검증이나 완전한 인프라 보안 감사가 아니다. 공개 문서의 노출을 제한하고, 정확한 자산 식별정보 및 추가 대응은 소유자 승인 하의 비공개 운영 기록으로 관리한다.

## 24. 2026-11-23 읽기 전용 확인: CoreHub Vercel 환경변수 메타데이터

Vercel 재인증 후 primary CoreHub 프로젝트의 environment variable metadata를 조회했다. `decrypt=false`로 실행했으며 환경변수 값은 복호화·출력·저장하지 않았다. API 호출, 설정 변경 및 DB 작업도 없었다.

- `NEXT_PUBLIC_SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY` 항목이 Production 및 Preview target에 등록돼 있고, 둘 다 Vercel에서 sensitive 값으로 취급된다. 도구 응답의 value는 비어 있었고 `decrypted=false`였다.

- 따라서 변수의 존재와 target만 확인됐다. 실제 Production Supabase URL/ref, service-role key 값의 유효성·실제 role, 이 URL이 앞서 catalog 점검한 DB를 가리키는지는 확인되지 않았다. 변수명만으로 실제 credential 권한을 입증하지 않는다.

- 값 복호화는 요청하거나 수행하지 않았다. Production 환경변수의 ref와 credential 유형을 대조하려면 소유자가 비공개 운영 화면에서 Supabase URL의 project ref와 key 유형만 확인해 전달해야 한다. 전체 URL, API key, JWT, token은 공유하지 않는다.

> 이 결과는 §23의 잠재 고위험/런타임 노출 미검증 판단을 해소하지 않는다. 배포 보호, handler 인증, DB 정책 또는 key를 변경하지 않았으며 운영 endpoint도 호출하지 않았다.

## 25. 2026-11-23 후속 기록: 헤르메스 DB 조사 보고서 대조

사용자가 전달한 헤르메스 조사 요약을 검토했다. 해당 보고서는 읽기 전용 목록·메타데이터 조사라고 설명하지만, 이 절에서는 보고서의 세부 inventory를 독립 검증한 사실과 구분한다. 보고서 전문이나 운영 데이터·세션·개별 object의 상세는 공개 문서에 복사하지 않았다.

### Supabase 용량 재측정

같은 날짜에 Supabase SQL catalog를 대상으로 읽기 전용 `pg_database_size` 및 relation-size 집계를 수행했다. 테이블 row 내용은 조회하지 않았다.

| 프로젝트 구분 | DB 전체 크기 | 모든 relation main fork 합계 | heap/table 계열 `pg_total_relation_size` 합계 |
| --- | --- | --- | --- |
| 별도 Hajunai | 약 12 MB | 약 11 MB | 약 12 MB |
| 통합 운영 DB | 약 491 MB | 약 28 MB | 약 31 MB |

이 결과에서 Hajunai의 DB 전체 크기는 앞선 약 12.55 MB 측정과 대체로 일치한다. 헤르메스 보고서의 약 224 KB는 DB 전체 크기와 같은 지표가 아니며, 이 요약만으로 DB 전체 용량을 대체하지 않는다. 통합 DB의 헤르메스 보고서상 약 4.8+ MB 역시 이번 DB 전체 약 491 MB와 동일한 기준이 아니다. relation 합계와 DB 전체 크기 사이 약 460 MB 차이는 현재 확인 자료만으로 원인을 설명할 수 없다. 이전의 약 514.60 MB와 이번 약 491 MB 차이, Supabase 화면의 530/500 MB와의 차이도 아직 해소되지 않았다. 백업·로그·TOAST 등이 원인이라는 보고서의 설명은 검증되지 않은 가설로 남긴다.

### 데이터·삭제 판단

- 헤르메스 요약은 Hajunai에 프로젝트 및 컨텍스트 행이 남아 있다고 보고하면서 동시에 “inactive/unused” 및 삭제 가능을 권고한다. 저장 행이 있다는 사실과 현재 서비스가 의존하지 않는다는 주장은 서로 다른 판단이며, 후자는 해당 요약의 저장소 metadata 확인만으로 외부 서비스·비추적 배포 설정·백업 필요성까지 배제하지 않는다.

- 통합 DB에서 실제 서비스 데이터·migration·Storage 사용 흔적이 있다는 헤르메스 보고는 운영 DB 보존 필요성을 뒷받침하는 참고자료로 취급하되, 공개 문서에는 세부 테이블명·사용자 수·object 식별정보를 추가하지 않는다.

- 보고서의 Hajunai 삭제 권고는 참고 의견이지 사용자 승인으로 간주하지 않는다. 현재 대화에서 사용자는 이전에 헤르메스 결과를 기다리겠다고 했으며, 이번 보고서 공유만으로 프로젝트 전체 영구 삭제를 승인한 것은 아니다. 삭제·정지·데이터 export/backup·RLS 변경은 수행하지 않았다.

### 다음 결정 전 최소 확인

1. Hajunai가 외부 앱·자동화·비추적 배포 또는 다른 사용자에게 쓰이지 않는지 소유자가 확인한다.

1. 남은 프로젝트/컨텍스트 데이터의 보존 필요성과 백업/export 필요 여부를 결정한다. 백업을 만들 경우 별도 비용·저장 위치·보안 취급도 고려한다.

1. Free 용량 초과의 원인은 Supabase의 공식 project/organization usage 화면 또는 지원 가능한 용량 지표로 별도 확인한다. 현재 pg relation 집계만으로 원인을 추정하지 않는다.

1. 위 확인 후에도 삭제를 원하면 프로젝트 이름·ref·region 및 전체 프로젝트 삭제 범위를 다시 제시하고, 사용자의 명시적 최종 승인을 받기 전까지 삭제하지 않는다.

> 본 절은 헤르메스 보고서를 삭제 승인으로 전환하지 않는다. 현재 최선의 상태는 Hajunai를 보류하고, 용량 원인과 데이터 보존 필요를 확인한 뒤 별도 결정을 받는 것이다.

## 26. 2026-11-23 설계 제안 검토: 메시지 계보와 현재 구현도

사용자가 제시한 “메시지 진화 프레임워크”는 **설계 의도**로 취급한다. 아래는 통합 Supabase metadata 및 집계 결과와 저장소 코드의 비교이며, 원문 메시지·payload 값·사용자 식별값은 조회하거나 기록하지 않았다. DB 쓰기와 앱 실행도 없었다. 코드 기준 HEAD는 CoreNull `2888653`, CoreHub `932cd90`이다.

### 프레임워크 수정 권고

1. “M0는 새로 생성되지 않는다”는 문구는 **하나의 계보 내에서 M0 원본을 최초 1회 정하고 이후 파생 생성이 그 원본을 재작성·대체하지 않는다**는 뜻으로 좁혀 쓴다. 새로 입력된 독립 원천 이벤트는 별도 M0′가 될 수 있다. “절대 멸실되지 않음”은 개념적 선언만으로 보장되지 않으므로 immutable storage, 보존기간, 백업·복구 검증을 별도 요건으로 둔다.

1. M0→M1→…→Mn을 단일 선형 체인으로만 가정하지 않는다. 여러 원천 메시지·관계·해석이 한 결과에 합쳐질 수 있으므로 실제 lineage는 여러 parent를 갖는 DAG일 수 있다. 각 edge에 관계 유형(derived-from, summarizes, translates, references 등), 출처 ID, 근거 수준 및 version을 둔다.

1. 제시된 4개 열은 유용하지만 다음처럼 분리·확장한다: **물리 저장 위치**(project/schema/table), **도메인 데이터 역할 및 canonical ID 의미**, **생성/변환 시스템과 코드 버전**, **권위 있는 writer·승인/소유자**, **원본·파생 lineage edge와 강제 방식(FK/배열/payload/코드 규칙)**, **승계·보존·삭제 가능 조건과 immutability enforcement**. 생성 시스템은 DB 소유자나 권한 주체와 동일하지 않다.

1. 중간 데이터 정리는 “새 세대가 필요한 정보를 받았다”는 주장만으로 가능하지 않다. lineage 폐쇄성, 재생성 가능성, 원본 보존, downstream dependency, 보존·복구 기준을 사람 승인으로 확인한 뒤 수행한다.

1. 반복 사이클에서 “새로운 M0”는 새 독립 원천 이벤트가 있을 때만 만든다. 기존 원본의 재해석·요약은 새 M0가 아니라 기존 계보 아래의 새 derived version으로 연결한다.

### 확인된 스키마·집계 사실

- `public.hajunai_conversations`에는 `original_message`, `summary`, `source_message_ids`(UUID 배열), `derived_version`, `derived_by`, `derived_at` 등 계보/파생 후보 필드가 있다. 560행 중 `source_message_ids`가 비어 있지 않은 행은 1개, 배열 원소는 총 1개였다. 그 ID는 현재 `public.messages.id` 및 `public.hajun_messages.id`와 일치하지 않았고, 이 배열 컬럼에 대한 FK도 없다. 그러므로 필드명만으로 실제 M0 연결이나 560건의 파생 관계를 입증하지 않는다.

- `public.hajun_messages` 224행 중 `ref_ids`가 있는 행은 97개(원소 325개)이며, 이 원소 중 현재 `public.hajunai_conversations.id`와 일치한 것은 0개였다. 스키마의 FK는 `room_id`를 방 테이블에 연결할 뿐 메시지 세대/원본 관계를 강제하지 않는다.

- `public.tb_trans_logs.message_id`는 값이 있는 8행 모두 현재 `public.messages.id`와 일치했다. 이는 해당 두 테이블 사이의 실제 ID 중첩을 보여 주지만, `hajun_messages` 또는 `hajunai_conversations`를 원본으로 삼는다는 뜻은 아니다.

- `public.corenull_message_outbox`는 10행이며 모두 `sent` 상태였고, 10개 `message_id`가 `public.messages.id`와 일치했다. DB FK도 outbox의 `message_id`를 `public.messages.id`에 연결한다. CoreNull 코드 `app/api/corenull/posts/route.js:148-257`는 `public.messages` INSERT 뒤 post/fruit의 ID를 outbox에 전달하고, `lib/corehubOutbox.js:19-48`은 idempotency key를 만든다. 같은 route의 PATCH 처리(`:376-446`)는 기존 메시지 본문 edit, soft-delete, rebirth를 허용하며 rebirth는 `meta.reborn_from`으로 기존 ID를 기록한다. 이는 저장소 코드상 의도이지 배포된 운영 경로의 실동작이나 M0 불변성 증명은 아니다.

- `corehub.connections` 48행의 `fact_ids` 배열은 총 254개 ID를 포함했고, 모두 현재 `corehub.facts.id`와 일치했다. FK 제약은 없지만 CoreHub 내부의 사실→관계 참조는 데이터상 연결돼 있었다.

- `corenull.posts.parent_id`에는 같은 posts 테이블을 가리키는 self-FK가 있다. 이는 게시물 간 부모 관계의 스키마 근거이지 M0 계보나 CoreHub 관계 연결의 증거는 아니다.

- `public.house_snapshots`는 스키마에 `source_message_ids`, `derived_version`, `derived_by`, `derived_at`을 갖지만 현재 행 수는 0이다. CoreNull `app/api/corenull/snapshots/route.js:1-4,73-83,139-149`는 메시지를 모아 source ID를 저장하는 snapshot 설계를 표현한다. 이는 코드 의도와 빈 저장공간의 확인이지, 운영에서 snapshot 세대가 반복 생성됐다는 증거는 아니다.

- `corehub.facts` 중 `source='CoreNull'`은 38행이다. 12행은 payload에 `message_id`, 6행은 `post_id`, 4행은 `parent_id` 키가 있었다. 세 후보 key 중 하나 이상이 현재 `public.messages.id`와 일치하는 서로 다른 fact 행은 12개였다. 같은 후보 UUID를 `corenull.posts.id`와 대조했을 때 일치한 것은 없었다. 따라서 현재 관측은 CoreNull facts가 `public.messages` 계열을 참조하는 경로를 일부 보여 주지만, 새 `corenull.posts` 테이블을 직접 승계한다는 증거는 아니다. `corehub.facts`에는 이 cross-system 관계를 강제하는 FK가 없다.

### 불변성과 시간 검증

- `hajun_messages`는 RLS가 켜져 있으나 사용자 trigger는 0개이고 policy도 0개였다. `service_role`에는 UPDATE와 INSERT 권한이 있다. 따라서 “UPDATE 금지, append만”이 요구사항 또는 운영 관습일 수는 있지만, 현재 확인한 DB 구조상 privileged service-role 쓰기까지 막는 append-only 불변조건은 구현돼 있지 않다. 권한·정책을 바꾸지는 않았다.

- `hajun_messages`의 생성시각은 2026-08-31 09:51:59 UTC부터 2026-11-22 11:37:21 UTC까지였다. migration history의 `enable_corehub_auth_tables_rls` 버전 값은 `20261122135209`이며 별도 applied-at 컬럼은 없다. version 값을 같은 시간대로 해석하면 최신 메시지보다 뒤지만, 시간대·실제 적용시각 기록이 없고 해당 migration 목적도 auth tables RLS이므로 메시지 생성과의 인과관계는 확인되지 않았다.

### 구현도 판단 및 가장 큰 미확인점

현재 DB/코드에는 **계보 후보 필드와 일부 관측 가능한 연결**(CoreNull message→outbox의 ID 연결, CoreNull facts payload의 일부 ID 교집합, CoreHub facts→connections)이 존재한다. 다만 이들이 연속된 완전한 lineage임은 확인되지 않았다. `hajunai_conversations`와 `hajun_messages` 간 원본 연결은 현재 참조 집계에서 입증되지 않았고, snapshot 테이블은 비어 있으며, `hajun_messages` append-only는 privileged 쓰기에서 강제되지 않는다. CoreNull API 코드가 `public.messages`의 본문 수정·soft-delete·rebirth를 제공하므로, 이를 M0로 지정한다면 현재 확인한 코드만으로는 불변 원본 요건을 충족한다고 볼 수 없다(배포된 운영 동작은 별도 미확인). 따라서 “M0→M1→…→Mn 반복 진화”가 전체 시스템에서 이미 구현됐다는 평가는 **미확인**이며, 일부 구성요소가 부분 구현된 상태로 보는 것이 타당하다.

가장 먼저 사람의 결정이 필요한 정의는 **canonical M0가 어느 도메인 객체인지**다: `public.messages`, `corenull.posts`, `public.hajun_messages`, 또는 새 원천 이벤트를 의미하는지 확정해야 한다. 그다음 `hajunai_conversations.original_message`와 `source_message_ids`의 계약, 여러 source를 묶는 lineage DAG, 불변·보존·복구 책임을 문서화해야 한다. 현 단계에서 데이터 이동·정리·schema 변경은 하지 않는다.

> 이 검토는 aggregate와 schema metadata만 사용했으며 실제 메시지 텍스트를 읽지 않았다. 다수 행 수는 SQL COUNT로 확인했고, 모든 매칭 결과는 해당 시점 DB의 ID 존재 여부만 뜻한다. 전체 역사적 lineage나 deployed code 실행 여부를 증명하지 않는다.

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

1. Path S 범위·허용 변경 파일·완료 기준과 기술/제품 승인자를 확정한다.

1. 기존 모듈·schema·API 클라이언트·mock/fixture 및 공식 계약을 먼저 조사해 재사용한다. 기존 자산으로 충족할 수 없을 때에만 새 endpoint, 구조, 환경변수 또는 데이터 구조를 별도 제안한다.

1. 개발/테스트/Preview 환경과 데이터가 Production과 분리되었음을 확인한다. 운영 자격 증명/데이터를 테스트에 쓰지 않는다.

1. 요청·응답 계약, 인증 주체, 권한, 오류/timeout/retry 동작, 데이터 부작용과 외부 호출 범위를 합의한다.

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

1. 기존 PR #2와 #3 중 Stage A Message를 수신할 실제 경로·저장 모델·이벤트 envelope를 한 계약으로 정합시킨다.

1. CoreNull worker 인증 및 payload를 확정된 CoreHub 수신 계약과 호환시킨다. hash 재계산, 정확한 replay 비교, DB 원자적 idempotency, retry/quarantine 처리를 staging에서 확인한다.

1. disposable staging에서 신규 저장, 동일 event replay, 변경 payload conflict, 동시 replay, ownership 거부, commit/응답 유실을 검증하고 결과/rollback을 남긴 뒤 운영 적용은 별도 승인으로 다룬다.

이 검토는 이전 A+B 결정이나 Vercel 소유자 측 보호 설정을 변경하지 않았다. Vercel 설정과 실제 배포 endpoint의 런타임 보호 여부는 이번 읽기 전용 저장소 검토에서 확인하지 않았다.

### 문서 연속성 메모

초기 읽기 시점의 `main` 본문에는 §§27–29만 있었고, 앞선 대화 요약에 나온 §32는 이 파일에서 찾지 못했다. 이후 전체 Git history에서 §§1–26을 보존한 parent commit을 찾아 §31에 기록한 대로 복원했다. §32는 과거 파일에서 복구한 내용이 아니라 사용자가 제공한 Production project ref 상태를 출처와 검증 경계를 붙여 새로 기록한다.

참고: [CoreHub PR #2](https://github.com/sykim-stack/brainpool-corehub/pull/2), [CoreHub PR #3](https://github.com/sykim-stack/brainpool-corehub/pull/3), [CoreNull Stage A PR #32](https://github.com/sykim-stack/brainpool-corenull/pull/32), [CoreNull Stage A 신뢰성 상태](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/doc/CORENULL_OUTBOX_STAGE_A_RELIABILITY_2026-11-12.md), [CoreNull outbox 설계 v1](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/doc/CORENULL_COREHUB_MESSAGE_OUTBOX_DESIGN_v1.md).

## 31. 2026-11-23 마스터 문서 히스토리 점검 및 복원

**검토 범위:** `BRAINPOOL_INTEGRATION_MASTER_2026-11-22.md`의 전체 Git commit history, `main` 외 공개 remote branches, 저장소의 관련 status 문서 및 PR 목록을 읽기 전용으로 대조했다. 이 감사 전 `main`의 마스터 파일에 있던 본문은 §§27–30이었다.

- 초기 마스터 commit `52091ed`에는 §§1–10이 있었다. 이후 변경으로 내용이 §§1–26까지 확장되었고, commit `1acd8d2`의 blob `2e1aac4`에서 §§1–26 전체를 확인했다.

- 과거 commit `a35c416`은 본문을 §25만 남긴 상태로 줄였지만, 후속 `a521448`이 1–25의 전체 내용을 다시 복원했다. 이후 `1acd8d2`에서 §26이 추가됐다.

- 이번 단절의 직접 원인은 `f6a354b`다. 이 commit은 `1acd8d2`를 parent로 두며 commit message는 “append”였지만, 실제 diff는 기존 문서에서 **539줄을 삭제하고 31줄만 추가**해 §§1–26을 제거하고 §§27–29만 남겼다. 따라서 이는 단순한 §32 미수록이 아니라 기존 마스터 본문이 현재 파일에서 빠진 truncation이었다.

- 복원 commit에서는 `1acd8d2`의 §§1–26 본문을 정확한 과거 원문으로 복구하고, 기존 main의 §§27–30을 그대로 보존한다. 여기에 본 히스토리 감사는 §31로 기록한다. 복구는 과거 자료에 근거한 문서 복원이며, 코드·DB·배포 변경이 아니다.

- 이번 세션을 시작하기 전 target master history에는 §§30–32가 없었다. 이번 세션에서 §30을 추가한 뒤 복원 직전 상태에는 §30만 있었고 §31–32는 없었다. 다른 remote branch에는 이 마스터 파일이 없었고, 저장소의 다른 문서 `BRAINPOOL_INTEGRATED_STRUCTURE_INVESTIGATION_v2_2026-09-28.md`에도 §32가 있으나 그 내용은 “최종 관점”이며 Production project ref 확인이 아니다. 해당 문서는 이 마스터와 별개다.

- 정확한 과거 원문에는 top-level `## 6.` 제목이 두 개 있다(“Git 브랜치와 PR 현황”, “Production 및 Staging 환경 구분”). 복구에서는 과거 텍스트를 그대로 보존해 이 번호 중복은 수정하지 않았다. 이는 기존 번호 정리 항목이며 §27–§32 단절의 원인은 아니다.

- §32의 Production project ref 상태는 과거 기록에서 복구한 것이 아니다. 사용자가 이전 진행 메시지에서 제공한 사실을 아래 §32에 출처를 구분해 새로 반영한다.

참고: [§§1–26이 보존된 commit `1acd8d2`](https://github.com/sykim-stack/brainpool-os/blob/1acd8d2201ba7d53821a3ad717706d15a2bc3b8b/doc/status/BRAINPOOL_INTEGRATION_MASTER_2026-11-22.md), [기존 본문을 잘라낸 commit `f6a354b`](https://github.com/sykim-stack/brainpool-os/commit/f6a354b2f464a5924bd9b793bba779f03bfad247), [별도 2026-09-28 조사 문서 §32](https://github.com/sykim-stack/brainpool-os/blob/main/doc/status/BRAINPOOL_INTEGRATED_STRUCTURE_INVESTIGATION_v2_2026-09-28.md#32-%EC%B5%9C%EC%A2%85-%EA%B4%80%EC%A0%90).

## 32. 2026-11-23 사용자 확인: Production Supabase project ref 정렬

**출처 및 검증 상태:** 이 항목은 사용자가 이전 진행 메시지에서 제공한 상태를 기록한다. 이번 문서 히스토리 점검은 Vercel/Supabase 설정을 재조회하지 않았으므로 아래 정렬 상태를 독립적으로 재검증한 결과로 해석하지 않는다.

사용자 확인에 따르면 **Hajun, CoreHub, CoreNull의 Production은 모두 Supabase project ref ****`grlfocvlfatuvphkyivd`****로 맞춰졌다.** 이 기록은 사용자가 밝힌 세 서비스 범위에 한정한다. CoreRing의 Production 상태는 이 문장만으로 추가 확정하지 않는다.

이 project ref 기록은 배포 URL 보호, handler 인증·인가, staging/Production 격리 또는 DB 권한 상태를 대신 확인하지 않는다. 기존 A+B 결정과 별도 보안·통합 게이트는 계속 유지한다.

## 33. 2026-11-23 후속 확인: CoreNull outbox ↔ CoreHub Facts/Auth UID 정합성

**범위:** 공개 GitHub 저장소의 main 및 PR #2/#3 head를 읽기 전용으로 비교했다. 저장소 checkout은 이번 세션에서 새로 만든 임시 복제본이며, 복제 시점 작업 트리는 모두 clean이었다. 사용자 로컬 작업 트리 상태를 확인한 것은 아니다. 본 절은 이 임시 복제본에만 기록했다. GitHub 파일, 코드, PR, DB, API, staging, 병합 및 배포는 변경하지 않았다.

### 기준 커밋 및 PR 상태

- `brainpool-os/main`: `df513d8bed071f54909463cdd64a10379632e195` (문서 history audit).

- `brainpool-corehub/main`: `932cd90d3a72935992b2fe32046512fdbf8bb768`.

- `brainpool-corenull/main`: `2888653a5c2db1c673a18e3e06ffd992cef2d5c8`.

- CoreHub PR #2는 OPEN/DRAFT, head `e62310abcb1efbdeec8357564c3ca2cfb7484054`; PR #3은 OPEN/DRAFT, head `b8b0c750c9fa76db7b94479e0816ef6d5ca4c307`. CoreNull PR #32(Stage A)는 MERGED다.

참고: [CoreHub PR #2](https://github.com/sykim-stack/brainpool-corehub/pull/2), [CoreHub PR #3](https://github.com/sykim-stack/brainpool-corehub/pull/3), [CoreNull PR #32](https://github.com/sykim-stack/brainpool-corenull/pull/32).

### 현재 CoreNull 구현과 기존 UID mapping

- CoreNull `app/api/corenull/posts/route.js`는 메시지 POST 처리에서 `messages` insert 후 별도 insert로 `corenull_message_outbox`를 적재한다. 두 작업은 하나의 DB transaction이 아니며 enqueue 실패는 사용자 쓰기를 되돌리지 않는다. 본문에는 `owner_key`가 있고 payload에는 message/house/room 내용이 들어가지만, 현재 Stage A row/envelope에는 verified Auth UID, `event_id`, `source_record_id`, `source_revision`, `payload_sha256`이 없다.

- 별도 CoreNull `/api/auth/core-session`은 CoreHub handoff exchange에서 받은 `auth_user_id`로 `resolveCoreNullOwnerByAuthUserId`를 호출한다. 이 helper는 기존 `corenull_owner_identities`에서 `provider='supabase'`를 우선 조회하고 `provider='auth'`를 대체 조회한다. 기존 매핑이 없으면 `owner_link_required`, 조회 오류면 `owner_mapping_unavailable`로 중단한다. 이 경로는 현재 post/outbox producer 또는 flush worker에서 호출되지 않는다. 따라서 기존 mapping 기능은 있지만 outbox로 연결되지 않은 상태다.

- Flush worker는 기존 Facts endpoint URL에 `source/fact_type/owner_key/house_id/occurred_at/payload`를 전송하고 `Idempotency-Key`만 보낸다. Authorization/HMAC, verified UID 및 PR #3 event envelope는 전송하지 않는다. `vercel.json`에는 `/api/corenull/outbox/flush` cron 항목이 있으나, 공개 저장소만으로 실제 Production cron 실행·producer 활성화·전달 성공을 확인하지 않았다. Worker 요청 인증 함수는 `CRON_SECRET`이 비어 있으면 인증을 허용하는 코드이므로 fail-closed가 아니다.

- 현재 worker는 8회 시도와 지수 backoff(15초부터 최대 30분)를 사용한다. 408/429 외의 4xx와 시도 한도 초과는 `failed`로 표시한다. 별도 `quarantined` 상태, atomic claim/lease/finalize, stale worker 보호는 없다. 동시 flush는 동일 pending row를 동시에 선택할 수 있다.

### CoreHub 수신 계약의 충돌

- CoreHub main의 `/api/corehub/facts`는 현행 legacy 계약대로 `owner_key`가 있는 Fact를 `corehub.facts`에 넣고 Connection 탐지를 시작한다. 정적 handler에서는 principal 인증이 확인되지 않는다. 실제 Production 노출·실행 상태는 이 코드 검토만으로 판정하지 않는다.

- PR #2 head는 사용자 Bearer 경로에서 verified Supabase Auth UID를 기준으로 처리하고, worker용 HMAC은 device principal로 처리한다. worker body에서 `owner_id`, `owner_key`, `auth_user_id`, `device_id`, top-level `house_id`를 거부한다. Message envelope branch는 `event_id/event_type/source_record_id/source_revision/payload_sha256`를 요구하고 `process_device_fact_event` RPC를 호출한다. 해당 PR head의 SQL은 `doc/staging`의 미적용 초안이며, source event 및 `message_mirror` 모델을 제안하고 `corehub.message_events`를 저장 대상으로 삼지 않는다. Message worker는 Auth owner가 아니라 HMAC device로 기록된다.

- PR #3은 문서 전용 초안이며 기존 Facts와 분리된 `POST /api/corehub/events/space-message`와 전용 `corehub.message_events` 저장 모델을 우선 제안한다. Envelope의 `owner_id`는 verified Auth UID이고 `owner_key` 자리에 대입하지 않는다. 그러나 HMAC worker가 실제 UID임을 입증하지 못하므로 `owner_id`/`house_id` 소유권 검증 방식은 미결정이며, ADR 승인은 worker 활성화 전제다.

- 이에 따라 현 CoreNull worker를 PR #2 또는 #3에 그대로 연결할 수 없다. 먼저 PR #2의 Facts/device-event/source_events+message_mirror 경로와 PR #3의 dedicated message_events 경로 중 실제 수신 저장 계약을 하나로 정합해야 한다. PR #2는 hash 형식을 검사해 RPC에 전달하지만 canonical payload를 독립 재계산하지 않는다. PR #2 head에는 HMAC 설정 메타데이터를 반환하는 임시 `hmac-debug` GET route가 있으므로 merge 전 제거/검토 대상이다. 이는 정적 코드 관찰이며 런타임 노출 주장은 아니다.

### 남은 결정 및 승인 경계

1. Verified Auth UID는 서버가 검증한 ticket/Auth 주체에서 얻고, 기존 Owner 매핑은 조회 전용으로 재사용한다. 요청 body의 `owner_key`/`auth_user_id`를 신뢰하지 않는다. mapping 없음·조회 오류·UID와 현재 Owner의 불일치·house/room scope 불일치는 fail-closed로 차단하며 새 Owner 생성·병합·backfill은 하지 않는 방향의 계약 승인 필요.

1. Message 작성자가 House owner인지 기존 member인지, Auth UID↔`owner_key` mapping만으로 event의 `house_id` 소유권을 증명할 수 있는지 결정해야 한다. PR #2의 house-owner 검증과 CoreNull의 기존 Owner/member 표현이 일치하는지도 확인이 필요하다.

1. 수신 endpoint/table, event envelope, Stage A `source_revision=1`, JCS 등 canonical hash 재계산, 동일 event의 모든 immutable field 비교와 DB 원자적 unique/idempotency 처리를 하나의 계약으로 확정한다.

1. HMAC 방식·nonce replay 방지·source/device binding·secret 운영과 owner/house scope 결속 방식을 승인한다. CoreNull worker의 인증 및 401/403/409/422 quarantine와 408/429/5xx/network retry 정책도 수신 계약과 정합시켜야 한다.

1. disposable staging, synthetic data, 명시 승인, 정확한 endpoint·요청/부작용 한계가 확인되기 전에는 outbox producer 활성화, E2E, 운영 endpoint/API/DB 접근, migration, staging 생성, 코드/PR 변경, 병합 또는 배포를 하지 않는다. 현재 검토만으로 배포·E2E 성공 상태를 주장하지 않는다.

**현 판정:** Stage A 코드와 기존 Auth UID→Owner mapping은 각각 존재하지만 서로 연결돼 있지 않다. CoreHub PR #2/#3은 모두 초안이며 서로 다른 수신 저장/인증 계약을 제안한다. Producer 활성화 및 E2E는 보류 상태를 유지한다. 이 §33은 로컬 임시 복제본에만 기록되었으며, 원격 master 갱신이나 PR은 만들지 않았다.

## 34. 2026-11-23 추천 1순위 검토: verified Auth UID와 기존 Owner/House scope

**범위:** CoreNull/CoreHub main 및 CoreHub PR #2 head의 저장소 코드·문서를 읽기 전용으로 대조했다. 운영 endpoint/API, DB, staging 및 테스트를 호출하지 않았고, 코드를 변경하지 않았다. §34는 §33과 마찬가지로 임시 로컬 복제본에만 기록한다.

### 현재 identity 경로에서 확인된 경계

- CoreNull `app/api/auth/google/route.js`는 `signInWithIdToken`으로 Google token을 검증해 Supabase `user.id`를 얻는다. 이후 기존 `provider='google'` identity를 `current_owner_key`와 연결하고, 별도 sync 요청으로 `provider='supabase'`, `provider_sub=user.id`를 같은 `owner_key`에 연결한다. 이 Google login/sync 흐름은 현재 CoreNull post-write API가 매 요청에서 호출하는 verified Auth gate가 아니다.

- `/api/auth/core-session`은 CoreHub handoff 교환 응답의 `auth_user_id`로 기존 `corenull_owner_identities`를 조회하고 `owner_key`를 반환한다. 그러나 CoreNull `app/api/corenull/posts/route.js`는 이 handoff cookie/access token을 검증하지 않고 request body의 `owner_key`로 쓰기 권한을 계산한다. outbox producer도 같은 body `owner_key`를 적재한다. 그러므로 handoff로 Auth UID를 얻을 수 있다는 사실만으로 개별 Message 작성 주체가 해당 UID임을 입증하지 않는다.

- 현 CoreNull 권한 코드는 `corenull_houses.owner_key`를 House owner와 비교하고, member는 `corenull_house_members.device_id`와 요청 `owner_key`를 비교한다. Message route는 owner 또는 room-scoped/house-wide member write를 허용한다. 저장소 코드에서 이 canonical House owner/member 모델을 `auth.users.id`에 직접 묶는 `owner_id` 컬럼을 확인하지 못했다.

- CoreHub PR #2의 ownership helper/문서는 검증된 `userId`를 `corenull.houses.owner_id`와 대조해 House ownership을 판정한다. PR #2 자체의 위험 분석도 현재 CoreNull schema가 `public.corenull_houses.owner_key` 중심이고 `owner_id` 정의가 확인되지 않았다고 적는다. 따라서 `auth_user_id → owner_key` identity mapping은 actor의 기존 Owner key를 복원하는 데 쓰일 수 있지만, 그 자체로 `house_id`가 해당 UID에 속하는지 또는 member 권한을 입증하지 않는다.

### 권고순서의 다음 결정

1. Producer 대상 write를 구분한다: verified Auth가 없는 기존 legacy write는 호환 경로로 두되 CoreHub event를 내지 않는 원칙을 유지한다. verified Auth UID는 server-side verified token/session에서만 취한다. body `owner_key`, `auth_user_id`, `device_id`를 증명으로 쓰지 않는다.

1. Stage A가 **House owner 작성 Message만** 수신할지, **기존 member 작성 Message도** 수신할지 제품/identity 소유자가 결정해야 한다. 현재 member `device_id`를 Auth UID로 바꾸거나 Owner key로 간주하는 것은 근거가 없다. 이 결정을 대신해 자동 mapping/backfill하지 않는다.

1. Owner-only 정책이 승인된다면 verified UID로 기존 `corenull_owner_identities` mapping을 조회하고, 매핑된 owner key와 해당 House의 기존 owner_key 관계를 서버에서 확인한 경우에만 producer eligibility를 부여하는 계약이 자연스럽다. 단, 이것은 여기서 승인된 구현안이 아니라 검토용 조건이며, 독립적인 house ownership 증명이 가능한지 계약·스키마 소유자 확인이 먼저 필요하다.

1. Member도 포함하려면 기존 member/device identity를 verified Auth UID에 안전하게 결속하는 기존 승인된 자료가 있는지 확인해야 한다. 없다면 member event는 제외/보류하거나 별도 승인된 identity mapping 정책을 마련해야 하며, device ID를 Auth UID로 추정하지 않는다.

1. UID 미매핑, mapping 충돌, House/room scope 불일치, identity 조회 오류는 fail-closed로 처리하고 어떤 경우에도 이 producer 경로에서 새 Owner 생성·자동 병합·mapping backfill을 하지 않는 것을 기본 안전 조건으로 둔다.

**판정:** 현재 사실만으로는 CoreNull post write의 caller를 verified Auth UID에 결속하거나, PR #2의 `house.owner_id` 검증을 기존 CoreNull `owner_key`/member 모델에 적용할 수 없다. 다음 단계 구현 전에 최소한 Stage A의 owner-only/member 범위와 House ownership 근거를 명시적으로 정해야 한다. 이 절은 결정 또는 구현 승인이 아니다.

참고: [CoreNull Google/Auth 연결 코드](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/app/api/auth/google/route.js), [CoreNull Message write route](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/app/api/corenull/posts/route.js), [CoreHub PR #2](https://github.com/sykim-stack/brainpool-corehub/pull/2).

## 35. 2026-11-23 추천 1순위 보충: Supabase House/identity schema metadata 대조

**범위:** §32에 기록된 공유 Supabase 프로젝트의 catalog metadata만 읽었다. `information_schema.tables/columns`와 `pg_constraint`에서 관련 객체 이름·컬럼·PK/FK/UNIQUE 정의만 확인했으며 House row, Auth 사용자, mapping row, owner 값은 조회하지 않았다. DML/DDL, 운영 API 호출, staging 생성 및 환경 설정 변경은 없었다.

### 확인된 schema metadata

- `corenull.houses`와 `public.corenull_houses`는 둘 다 `BASE TABLE`로 존재한다. `corenull.houses`에는 `id uuid`, `owner_id uuid`, `owner_key text`가 있다. Catalog FK는 `owner_id → auth.users(id) ON DELETE CASCADE`를 가리킨다. 따라서 CoreHub PR #2의 `ownedHouseQuery`가 기대하는 `corenull.houses.owner_id`는 현재 catalog metadata에서 확인됐다.

- `public.corenull_houses`에는 `id uuid`, `owner_key text`가 확인됐고 `owner_id` 컬럼은 없다. CoreNull의 현재 posts/rooms 코드와 `corenull_house_members`가 이 public 모델을 사용한다. `corenull_house_members.house_id`는 `public.corenull_houses.id`를 참조하고, member key `device_id`는 text다.

- 조사한 FK 목록에서 `corenull.houses`와 `public.corenull_houses` 사이의 FK는 확인되지 않았다. 두 House 객체의 ID/row가 같은 논리 House를 가리키는지, 앱 계층 sync/view/trigger가 있는지, owner/member 범위가 동기화되는지는 catalog만으로 확정할 수 없다.

- `public.corenull_owner_identities`의 현행 columns는 `provider`, `provider_sub`, `owner_key` 등을 포함하며 `auth_user_id` 컬럼은 없다. UNIQUE는 `(provider, provider_sub)`다. 현재 CoreNull resolver는 verified handoff UID 문자열을 `provider_sub`로 조회한다. CoreHub PR #2의 staging mapping SQL은 이 테이블에 별도 `auth_user_id` column과 인덱스를 추가하는 초안이므로, main의 current lookup 계약과 staging draft 계약은 아직 같은 구현이 아니다.

### 갱신된 판단

CoreHub PR #2의 canonical ownership table이 전혀 없다는 뜻은 아니다. 오히려 `corenull.houses.owner_id`는 Auth UID FK를 갖지만, CoreNull의 실제 message write 및 member authorization은 `public.corenull_houses`/`public.corenull_house_members`를 사용한다. 두 House 테이블 간 선언된 FK가 없으므로 `public.corenull_houses.id`를 PR #2의 `corenull.houses.id`와 동일시하거나, `owner_key`만으로 그 관계를 증명하면 안 된다. §34의 결론은 유지한다: schema가 둘 다 존재하는 사실만으로 message write caller의 Auth UID, public House ownership 또는 member identity를 입증할 수 없다.

다음 read-only 단계에서 관계를 더 확인하려면 허용 범위를 먼저 정해야 한다. 최소 공개값으로 aggregate/match counts만 조사하는 방법이 있지만, 이는 Production의 House/identity row들 사이 관계를 읽는 작업이다. 현재는 row-level 관계 조회를 하지 않았다. 구조/identity owner가 두 모델의 canonical source와 연결 규칙을 확인하거나, 명시 승인된 비운영 fixture로 검증하기 전에는 producer eligibility 결론, backfill, DB 수정, staging/E2E를 진행하지 않는다.

추가 경계: CoreNull `app/api/identity/sync/route.js`는 기존 mapping이 없을 때 요청의 `owner_key`를 사용하거나 새 UUID `owner_key`를 생성해 mapping을 insert할 수 있다. 따라서 이 일반 sync/write endpoint를 “기존 매핑만 사용하는 outbox producer resolver”로 그대로 재사용하면 안 된다. Producer eligibility 검토는 검증된 Auth UID를 받은 뒤 existing-only `resolveCoreNullOwnerByAuthUserId` 조회 결과를 사용하는 별도 계약이어야 하며, 이번 검토에서는 endpoint를 호출하지 않았다.

## 36. 2026-11-23 승인된 aggregate-only 관계 확인

**승인 범위:** 사용자가 aggregate-only SELECT를 허가했다. 공유 Supabase의 public/canonical House 간 row 관계와 `provider='supabase'|'auth'` identity의 canonical House owner 연결 여부를 집계했다. 반환값은 count만이며 House ID, `owner_key`, Auth UID, Message 본문 및 mapping row 값은 결과로 반환하거나 문서에 기록하지 않았다. SQL은 SELECT만 수행했고 LIMIT를 명시했다. DML/DDL/API/staging/배포 작업은 없었다.

### 집계 결과

- `public.corenull_houses`: 11 rows. `corenull.houses`: 24 rows.

- `public.corenull_houses.id`와 `corenull.houses.id`의 일치: **0**. 따라서 두 집합 사이의 ID match에서 `owner_key` 일치/불일치 건수는 모두 0이고, public House 11건은 모두 canonical House ID match가 없었다.

- ID와 독립적으로 두 테이블의 `owner_key`를 SQL equality로 대조한 결과도 일치 pair **0**, 일치하는 public House **0/11**, canonical House **0/24**였다. 두 키가 모두 일치하는 pair도 0이다.

- `public.corenull_owner_identities`에서 `provider IN ('supabase','auth')`인 mapping을 canonical `corenull.houses.owner_key`와 대조했을 때, owner-key 연결이 있는 canonical House: **0/24**. 이 중 exact `provider_sub = owner_id` 매치도 0, owner-key 연결 뒤 UID mismatch도 0. 현재 조사한 조건에서는 canonical House 24건 모두 기존 Auth identity mapping과 연결되지 않았다.

### 판단

이 결과는 두 House 객체가 같은 ID 체계로 연결됐다는 근거를 제공하지 않는다. 또한 현행 `corenull_owner_identities(provider, provider_sub, owner_key)`를 통해 canonical `corenull.houses.owner_id`를 복원할 수 있다는 것도 확인되지 않았다. 이는 이번 aggregate query의 join 기준(기존 identity mapping의 `owner_key`와 canonical House `owner_key`)에 한정된 결과이며, 다른 identity store나 별도 app-level link의 존재를 배제하지 않는다. CoreNull 메시지 route는 `public.corenull_houses`를 사용하므로, Stage A producer의 verified UID→existing owner_key→House 결속은 현재 증거로 통과하지 못한다. producer 활성화, E2E, backfill 또는 schema 변경은 계속 보류한다.

다음 순서는 row-level Production query를 확장하는 것이 아니라, 두 House 모델의 canonical source/연결 책임자가 ID 및 ownership mapping의 의도된 관계를 설명하거나 disposable non-production fixture에서 관계를 검증하도록 하는 것이다. 그 전까지 member/legacy write를 Auth UID로 추정하거나 `owner_key`를 Auth 인증의 대체물로 취급하지 않는다.

## 37. 2026-11-23 공개 PR 기록: House 소유권 ADR과 수신 계약은 미승인

**범위:** 공개 GitHub PR 상태·설명·타임라인만 읽었다. PR 본문/코드 변경, 리뷰 제출, comment, merge, branch push는 하지 않았다. 아래 상태는 2026-11-23 확인 시점이며 비공개 의사결정은 판정하지 않는다.

### 확인 결과

- [brainpool-os PR #1 — Auth UID와 House ownership alignment 제안](https://github.com/sykim-stack/brainpool-os/pull/1)은 `open`, 미병합이다. 설명은 `Proposed — human approval required`로 남아 있고, 공개 API에는 requested reviewer가 없다. 제안은 `corenull.houses.owner_id`와 `owner_key`를 보존하고 staging-only identity mapping 검증 및 legacy backfill 금지를 제시한다. PR 타임라인의 schema correction도 ADR은 제안 상태이며 staging fixture와 producer/outbox validation 전까지 승인되지 않았다고 적는다.

- [CoreHub PR #2](https://github.com/sykim-stack/brainpool-corehub/pull/2)는 `open/draft`, 미병합이다. PR body는 CoreNull Auth/outbox 통합과 staging 검증을 production use의 선행 조건으로 둔다. 10월 16일의 공개 코멘트는 `public.corenull_houses.owner_key` 보존과 nullable Auth UID link를 제안하지만, route 구현은 바꾸지 않았고 ADR #1 승인 및 CoreNull schema/API migration 승인까지 현재 `corenull.houses` query가 blocker라고 명시한다. 이는 승인된 적용 계약이 아니다.

- [CoreHub PR #3](https://github.com/sykim-stack/brainpool-corehub/pull/3)는 `open/draft`, 미병합, 문서 변경이다. 별도 Message Event 경로를 제안하며 HMAC/shared-secret 인증, `event_id` idempotency, conflict 시 409, 401/403/409 quarantine 및 5xx retry 방향을 적었지만, auth ADR과 저장 모델(기존 Facts 확장 또는 전용 Message Event table)은 미결로 남아 있다.

- [CoreNull PR #24](https://github.com/sykim-stack/brainpool-corenull/pull/24)는 merged 상태지만 Message outbox 설계 문서만 병합했다. 설명은 `owner_key`와 기존 provider identity semantics를 보존하고, verified `auth_user_id` mapping을 별도 계약으로 두며, legacy owner_key-only write가 verified CoreHub event를 만들지 않도록 하고 Message/outbox를 하나의 transaction boundary로 묶자는 제안이다. 이 PR 자체는 migration, DB write 또는 실행 코드 변경을 하지 않았다.

### 현재 남은 차이와 다음 승인 경계

§36의 Production aggregate는 `public.corenull_houses`와 `corenull.houses` 사이에 ID 또는 독립 `owner_key` equality 교집합을 확인하지 못했다. 공개 ADR/PR 기록에서도 이 차이를 해결한 후속 승인이나 mapping 구현은 확인되지 않았다. 특히 PR #2 공개 코멘트의 `public.corenull_houses.owner_id` 제안과 현재 route의 `corenull.houses` query는 서로 다른 집합을 가리키므로, 코드가 이미 canonical source로 합의됐다고 볼 수 없다.

따라서 다음 구현 이전에 필요한 소유자 결정은 다음과 같다: (1) CoreNull Message의 canonical House source와 그 source를 Auth UID에 연결하는 승인된 근거, (2) outbox 대상이 verified House owner write만인지 기존 member write도 포함하는지, (3) CoreHub receiver가 PR #2 Facts 경로인지 PR #3 전용 Message Event 경로인지와 그 저장 모델/authentication contract. 공개 기록만으로 이 선택을 대신하지 않으며, 이 문서 갱신은 ADR/PR 승인이나 구현 승인이 아니다. producer 활성화, E2E, 추가 Production row 조회, migration, backfill 및 배포는 계속 보류한다.

## 38. 2026-11-23 목적 재확인: 메시지 연결구조로 의미를 만드는 통합

**사용자 설명:** 이 작업의 목적은 별도 프로젝트에서 메시지 연결구조를 통해 의미를 만들도록 CoreNull 메시지를 연결하는 것이다. House/Auth 검토는 통합 자체의 목표가 아니라, 메시지를 안전한 Owner/House 범위에 붙이기 위한 선결 조건이다. 따라서 앞서 던진 “어느 House source인가”라는 단일 선택 질문은 목표를 좁게 잡은 것이며, 이를 제품 목표로 간주하지 않는다.

### 기존 코드와 계약의 실제 기능

- CoreNull `posts/route.js`에서 `comment`는 Message row insert 후 바로 응답해 outbox를 만들지 않는다. `post`와 `fruit`는 `space.message.created` outbox에 들어가며 payload에 원본 `relations`, `meta`, `house_id`, `room_id` 등이 보존된다. `fruit`는 별도 `space.fruit.created` Fact도 enqueue한다. 따라서 목표 연결구조에 comment 관계가 필요하다면 현재 Message outbox 범위가 빠져 있다.

- CoreNull flush worker의 기본 destination은 CoreHub `/api/corehub/facts`다(환경변수 `COREHUB_API_URL`이 override될 수 있으나 런타임 설정은 확인하지 않았다). 현재 worker가 보내는 body는 `owner_key`, `house_id`, `fact_type`, `occurred_at`, payload 중심이며 PR #3의 `event_id/source_revision/owner_id/payload_sha256` 계약과 다르다. Stage A reliability 문서상 verified Auth producer, lease, quarantine, 동일 transaction은 아직 보장하지 않는다.

- CoreHub main `POST /api/corehub/facts`는 Fact를 저장한 뒤 `detectConnections`를 비동기로 호출한다. 연결 규칙은 최근 20개 동일 `owner_key` Fact의 `fact_type` 조합을 보고 `connections`/`meanings`/`opportunities`를 생성한다. 이 현재 코드에는 `payload.relations` 또는 메시지 `parent_id`를 읽어 명시적 메시지 edge를 만드는 처리가 없다. 따라서 이 기존 meaning path는 일부 Fact type 조합의 휴리스틱이며, 메시지 relation graph를 직접 소비하는 것으로 확인되지 않았다.

- CoreHub PR #2의 worker message RPC 초안은 `source_events`와 `message_mirror`에 durable/idempotent하게 기록하지만 결과에 `derived_processing=false`를 두며 Fact/Connection/Meaning/Opportunity를 생성하지 않는다. PR #3 초안도 Stage A에서 event를 전용 수신 모델에 저장한 뒤 Facts/Connection/Meaning/Opportunity를 호출하지 않는다고 명시한다.

### 통합상 핵심 간극

현재 사실상 둘 중 하나만 얻는 형태다. 기존 Facts route는 일부 Connection/Meaning을 생성하지만 body `owner_key` 중심이며 verified Auth/House 연결이 입증되지 않았다. 보안 강화를 제안하는 PR #2/#3 경로는 durable message observation을 저장하지만, 사용자가 밝힌 메시지 연결 기반 의미 생성까지 이어지지 않는다. `relations`가 envelope payload에 보존된다는 것만으로 의미 엔진이 그 링크를 해석·연결한다고 볼 수 없다.

따라서 다음 read-only 검토의 중심은 House source를 독립적으로 선택하는 것이 아니라, 현재 CoreNull에서 의미 있는 메시지 관계로 쓰이는 필드·이벤트(post/comment/fruit/seed 및 `relations`)가 어느 범위인지 코드/계약에서 표로 대조하고, 이를 CoreHub Connection/Meaning 입력으로 안전하게 전달하는 기존 경로가 있는지 확인하는 것이다. Owner/Auth/House 스코프는 그 전달 경로의 보안 전제이며, 임의 매핑·backfill로 메우지 않는다. 이 범위 확인은 구현/ADR/PR 승인이나 추가 Production SELECT 허가가 아니다.

참고: [CoreNull Message route at inspected main](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/app/api/corenull/posts/route.js), [CoreNull outbox flush route at inspected main](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/app/api/corenull/outbox/flush/route.js), [CoreHub Facts/Connection/Meaning route at inspected main](https://github.com/sykim-stack/brainpool-corehub/blob/932cd90d3a72935992b2fe32046512fdbf8bb768/app/api/corehub/facts/route.js), [CoreHub PR #2](https://github.com/sykim-stack/brainpool-corehub/pull/2), [CoreHub PR #3](https://github.com/sykim-stack/brainpool-corehub/pull/3).

## 39. 2026-11-23 message link field 대조: 전달은 일부, 연결 해석은 미확인

| CoreNull 관계·의미 | 현재 생산/전달 필드 | CoreHub main에서 확인한 소비 | 차이 |
| --- | --- | --- | --- |
| 댓글 → 원문 포스트 | `messages.type='comment'`, `relations.parent_id` | CoreNull posts route의 comment 분기는 Message만 insert하고 바로 return. outbox event를 만들지 않는다. CoreNull master도 `relations.parent_id`를 comment-to-post link로 정의한다. | 해당 edge는 Stage A Message outbox에 도달하지 않는다. |
| 포스트 → House/Room 및 기타 관계 | `house_id`, `room_id`, `relations`, `meta`가 `space.message.created` payload에 포함 | CoreHub main의 `detectConnections`는 recent Fact types와 같은 `owner_key`를 사용하며 `payload.relations`/`parent_id`를 읽지 않는다. | payload 보존과 graph edge 생성은 별도 단계이며, 현재 route에서 명시적 message relation 소비는 확인되지 않는다. |
| 포스트에서 생성된 fruit → 원문 relation | posts route의 fruit 경로에서 `space.message.created`와 `space.fruit.created`가 각각 enqueue된다. 별도 fruit Fact payload는 `relations.parent_id`를 담는다. | `seed.to.fruit.achieved` 규칙은 최근 동일 Owner Fact 목록에 seed/fruit type이 있는지만 본다. 부모 ID나 run ID의 일치를 비교하지 않는다. | 명시된 부모 연결은 Fact payload에 있으나 해당 Connection predicate에서는 사용되지 않는다. |
| Seed run → 시작 메시지 | `space.seed.created` payload에 `run_id`, `start_post_id`, `room_id`, `house_id` 등이 들어간다. | 현재 CoreHub 규칙은 seed type 존재를 사용하지만 `run_id` 또는 `start_post_id`를 연결 키로 비교하지 않는다. | 실제 시작 메시지와 generated fruit가 같은 run에 속하는지 current detector가 확인하지 않는다. |
| Seed run → generated fruit | `space.fruit.created` payload에 `run_id`, `fruit_message_id`, `seed_page_id` 등이 들어간다. | 같은 Owner의 recent 20 facts에서 `space.seed.created`와 `space.fruit.created`가 함께 보이면 connection candidate를 만든다. | predicate는 source IDs/run IDs가 아니라 유형 동시 존재를 기준으로 하므로 unrelated run을 합칠 가능성이 코드상 있다. 이는 구현 경로에서 도출한 위험이며 Production에서 잘못된 edge가 발생했다는 관측은 아니다. |
| Message 수정/상태 변화 | edit/archive/delete/harvest 등의 route 경로가 있으나 create-only source revision 계약은 미적용. Harvest에는 별도 `space.fruit.harvested` enqueue가 있다. | Stage A Message Event contract는 create revision 1만 대상으로 하며, 이후 event 종류/revision은 미구현 또는 별도 제안이다. | 관계가 나중에 수정·보관·수확되어도 message event graph가 어떻게 갱신되는지 계약이 없다. |

**판단:** 현재 시스템은 일부 link 값(`relations.parent_id`, `start_post_id`, `run_id`, `fruit_message_id`)을 원본 Message 또는 Fact payload에 담을 수 있지만, Stage A/CoreHub Connection rule에서 그 관계를 명시적으로 해석해 의미 연결을 만든다고 확인되지 않았다. 특히 comment edge는 outbox에서 빠지고, 현재 seed/fruit heuristic은 stable relation key의 일치를 요구하지 않는다. 따라서 “메시지 event가 저장된다” 또는 “Fact type이 도착한다”만으로 프로젝트 목적의 message-link meaning이 달성됐다고 판정하면 안 된다.

이번 매핑은 저장소 코드/문서만 읽은 결과다. Production row 조회, API 호출, DB 쓰기, staging 생성, 코드/PR 변경은 없었다. 다음 계약 검토는 목표로 삼는 link types와 edge identity (`parent_id`, `run_id`, `start_post_id` 등)를 기존 CoreHub Connection/Meaning 입력과 대조하되, 의미를 새로 설계하거나 관계를 추정하지 않고 제품/프로젝트 정의에 근거해야 한다.

참고: [CoreNull Message types and comment link](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/doc/CORENULL_MASTER.md), [CoreNull Message producer](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/app/api/corenull/posts/route.js), [CoreNull seed/fruit producer](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/lib/seedPeriod.js), [CoreHub main Facts/Connection/Meaning handler](https://github.com/sykim-stack/brainpool-corehub/blob/932cd90d3a72935992b2fe32046512fdbf8bb768/app/api/corehub/facts/route.js), [CoreHub Message Event contract draft](https://github.com/sykim-stack/brainpool-corehub/pull/3).

## 40. 2026-11-23 사용자 설명: CoreRing/CoreNull 상호 ID와 1인 메시지 의미화

**사용자가 설명한 기획 목적:** CoreRing을 사용하면 CoreNull ID가 생성되고, CoreNull을 사용해도 CoreRing ID가 생성된다. 제품 프로젝트는 2개지만 사용자는 1명이다. CoreHub와 HajunAI는 그 한 사람의 메시지를 분석해 의미를 만들고 재가공한다.

### 기존 조사 결과와의 관계

§36의 aggregate는 Production의 `public.corenull_houses`와 `corenull.houses` 두 House 테이블에서 ID 및 `owner_key` equality를 비교한 것뿐이다. 그 결과는 사용자가 설명한 CoreRing↔CoreNull 상대 프로젝트 ID 생성 흐름, 사람 단위의 cross-project identity mapping, 또는 CoreHub/HajunAI로 들어가는 메시지 분석 범위를 조사하지 않았다. 따라서 House 테이블의 직접 일치 0건만으로 “한 사람의 ID 통합이 없다”거나 제품 의도가 성립하지 않는다고 결론내릴 수 없다. 이 결과가 말해 주는 것은 조사한 House row 사이의 직접 equality가 관측되지 않았다는 점에 한정된다.

### 다음 읽기 전용 확인 방향

후속 검토는 House 테이블을 억지로 동일시하지 않고, (1) CoreNull 사용 시 CoreRing ID가 생성되는 경로와 반대 방향 경로, (2) 그 ID들이 한 사람에 연결되는 기존 mapping/source of truth, (3) CoreNull·CoreRing 메시지가 CoreHub/HajunAI에 들어가고 의미화·재가공되는 실제 코드/계약을 순서대로 대조한다. 메시지 source identity와 message-link relation을 함께 보존하는지가 핵심이다. 사용자가 기획 설명을 이어가는 동안에는 이 목적을 새 ADR·schema·mapping 결정으로 확장하지 않으며, 별도 승인 없이 Production SELECT 범위 확대, DB/API write, staging, 코드·PR 변경, merge/deploy를 하지 않는다.

## 41. 2026-11-23 상호 ID·사람 단위 메시지 흐름 대조

**검토 범위:** CoreRing `brainpool-clean/main` (`41b293a397b4101c90e0582c4f420b82f28983b2`), HajunAI `hajuncore-app/mes/integration-1` (`9ebe3c69c735dec67a92967d46498165d1a9c60a`), CoreNull `main` (`2888653a5c2db1c673a18e3e06ffd992cef2d5c8`), CoreHub `main` (`932cd90d3a72935992b2fe32046512fdbf8bb768`)의 로컬 복제본을 읽기 전용으로 대조했다. 작업 트리는 모두 clean이었다. Production DB/API, env/secrets, 브라우저, 코드·PR·원격 저장소 변경은 없었다.

### 기획 목적과 확인된 코드의 구분

사용자의 기획은 CoreRing과 CoreNull이 서로 상대 프로젝트의 ID를 생성/연결해도 사람은 하나이며, CoreHub와 HajunAI가 그 사람의 메시지를 분석해 의미를 만들고 재가공하는 것이다. 아래는 이 목표가 맞는지 평가하는 것이 아니라, 지정된 브랜치의 코드에서 실제 구현된 ID·메시지 흐름을 구분한 결과다.

### ID 역할과 상호 생성 경로

- CoreNull은 `corenull_owner_key`를 자체 Owner identity로, `corenull_device_id`를 device key로, Supabase Auth UID와 Google provider subject를 별도 인증 identity로 다룬다. Google 로그인 경로는 Supabase Auth를 통해 Google ID token을 검증한 뒤 기존 또는 새 CoreNull `owner_key`를 확보하고, Google subject 및 Supabase Auth UID를 `corenull_owner_identities(provider, provider_sub, owner_key)`로 연결한다. CoreHub handoff resolver는 Auth UID의 기존 mapping을 조회하며, 없으면 새 Owner를 생성하지 않고 거부한다.

- CoreRing은 브라우저에서 자체 `corering_device_id`를 만들고, `corenull_owner_key`라는 선택적 localStorage 값을 읽어 요청에 실을 수 있다. 확인한 코드에는 CoreNull Owner 생성/인증 API 호출이나 `corering_device_id ↔ owner_key` crosswalk 저장이 없다. CoreRing CoreNull house lookup은 이미 제공된 `owner_key`를 사용한 read 경로다. 두 서비스 origin이 다르면 같은 localStorage key name만으로 브라우저 저장소가 공유되지 않는다.

- 반대 방향으로, CoreNull 코드에서 CoreRing ID를 생성하거나 CoreNull Owner/Auth ID에 교차 연결하는 실행 경로도 확인하지 못했다. CoreNull의 기존 매핑은 Google/Supabase Auth subject와 CoreNull `owner_key`를 연결하지만, CoreRing `device_id`와의 mapping은 아니다.

- 따라서 사용자가 설명한 상호 ID 생성은 **기획 기준으로 기록**하지만, 선택한 CoreRing `main`과 CoreNull `main`의 코드만으로 구현을 입증하지 못했다. 별도 배포 설정, 다른 branch, 외부 서비스 또는 수동 절차의 존재는 이번 조사에서 확인하지 않았다.

### HajunAI 메시지와 CoreHub 의미 경로

- HajunAI의 자유 채팅은 브라우저 `device_id`를 기준으로 최근 대화와 질문을 Hajun API/LLM에 보낸다. 대화는 Hajun 자체 저장 경로와 browser localStorage를 사용한다. 이 흐름은 CoreNull Auth/Owner와 연결된다고 확인되지 않았다.

- 별도의 `post_message`는 사용자가 명시적으로 “마당에 남기기”를 실행할 때 메시지를 영구 저장하고 `room_id`, `author_type`, `msg_type`, `content`, `ref_ids` 등을 갖는다. 이후 선택적으로 `synthesize_context`를 호출한다. 이 별도 저장 행위와 자유 채팅 질의 경로를 동일시하지 않는다.

- CoreNull `post`/`fruit`는 기존 Outbox를 통해 CoreHub Facts 경로로 보내지만, 현재 producer는 request body의 `owner_key`를 사용하고 verified Auth UID를 생산 이벤트에 결속하지 않는다. CoreHub main Facts 경로는 일부 동일 Owner Fact type 조합으로 `Connection → Meaning → Opportunity`를 생성하지만, 명시적 message `relations`를 직접 edge로 해석하지 않는다.

- CoreHub Opportunities 조회 경로는 Bearer에서 Auth UID를 확인한 뒤 `corehub.auth_owner_links`에서 Owner scope를 구한다. HajunAI 호출부는 local `device_id`/`ownerKey`를 사용하고 Authorization을 붙이지 않는 호출이 있어, 확인한 코드 계약상 이 보호된 Opportunity API와 연결이 맞지 않는다. CoreNull `corenull_owner_identities`에서 CoreHub `auth_owner_links`로 mapping을 자동 동기화하는 코드도 확인하지 못했다.

### 갭과 다음 읽기 전용 단계

현재 구현에는 최소 세 가지 identity namespace가 있다: 사람의 검증된 Auth UID, CoreNull `owner_key`, CoreRing/HajunAI의 local/device ID. 이름이 같거나 요청에 함께 실린다고 동일한 사람을 증명하는 것은 아니다. 현재 코드에서 CoreNull Auth↔Owner 매핑 일부는 있지만, CoreNull↔CoreRing 상호 ID 연결과 HajunAI 메시지↔그 같은 사람의 canonical scope 연결은 끝까지 입증되지 않았다. 그 결과 한 사람의 메시지가 CoreNull/CoreRing/HajunAI를 거쳐 같은 Owner scope의 CoreHub meaning으로 이어진다고 말할 수 없다.

다음 읽기 전용 검토는 (1) 사용자 설명의 상호 ID 생성이 어느 API/화면/로그인 동작을 가리키는지 지정 브랜치 간 재대조, (2) HajunAI의 자유 채팅과 별도 `post_message`의 의도된 분석·재가공 역할 구분, (3) CoreNull/CoreRing/HajunAI message source identity를 CoreHub meaning scope에 연결하는 기존 승인된 route가 있는지 확인하는 순서로 진행한다. 구현이나 새 crosswalk 설계로 넘어가지 않고, 이 코드 조사만으로 기획 의도를 부정하지 않는다.

참고: [CoreRing browser principal](https://github.com/sykim-stack/brainpool-clean/blob/41b293a397b4101c90e0582c4f420b82f28983b2/app/page.tsx), [CoreRing principal resolver](https://github.com/sykim-stack/brainpool-clean/blob/41b293a397b4101c90e0582c4f420b82f28983b2/lib/security/principal.ts), [CoreNull Google identity route](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/app/api/auth/google/route.js), [CoreNull identity sync route](https://github.com/sykim-stack/brainpool-corenull/blob/2888653a5c2db1c673a18e3e06ffd992cef2d5c8/app/api/identity/sync/route.js), [HajunAI chat page](https://github.com/sykim-stack/hajuncore-app/blob/9ebe3c69c735dec67a92967d46498165d1a9c60a/app/chat/page.tsx), [HajunAI chat API client](https://github.com/sykim-stack/hajuncore-app/blob/9ebe3c69c735dec67a92967d46498165d1a9c60a/lib/hajunApiPost.ts), [CoreHub Opportunity API](https://github.com/sykim-stack/brainpool-corehub/blob/932cd90d3a72935992b2fe32046512fdbf8bb768/app/api/corehub/opportunities/route.js).

## 42. 2026-11-23 후속 조사 후보: 원격 identity/handoff 브랜치 목록

원격 Git branch ref 이름만 읽기 전용으로 조회했다. 다음 후보는 이름만으로 구현 사실을 입증하지 않으며, branch tree/code/PR 상태는 아직 검토하지 않았다.

- CoreRing `brainpool-clean`: `feat/corering-handoff-receive`, `mes/integration-1`

- CoreNull `brainpool-corenull`: `foundation/auth-actor`, `foundation/owner-device`, `integration/corenull-design-rc`, `docs/corehub-message-outbox-2026-10-20`

- HajunAI `hajuncore-app`: `feat/path-s-corehub-session`, `feat/auth-handoff-main`, `feat/corering-handoff-button`

- CoreHub `brainpool-corehub`: `feat/p4-bearer-owner-key-scope`, `poc/corering-p4-assertion-verifier`

- 통합 기준 `brainpool-os`: `docs/identity-ownership-alignment-2026-10-16`

출처: [CoreRing branches](https://github.com/sykim-stack/brainpool-clean/branches/all), [CoreNull branches](https://github.com/sykim-stack/brainpool-corenull/branches/all), [HajunAI branches](https://github.com/sykim-stack/hajuncore-app/branches/all), [CoreHub branches](https://github.com/sykim-stack/brainpool-corehub/branches/all), [brainpool-os branches](https://github.com/sykim-stack/brainpool-os/branches/all).

## 43. 2026-11-23 통합 작업 완료·미완료 현황 및 다음 기준

**목적:** §§1–42의 기존 기록을 기준으로 완료된 작업과 아직 입증·승인·구현되지 않은 작업을 분리한다. 이 절은 기존 기록을 재분류한 상태 요약이며, 새로운 설계·구현·승인·운영 변경을 의미하지 않는다. 완료 판정은 아래에 명시한 범위에 한정한다.

### 43-1. 완료된 작업

| 항목 | 완료 판정 | 근거 및 범위 |
| --- | --- | --- |
| HajunAI → CoreHub → CoreNull Path S 인증 Handoff | **완료** | Hajun Google/Supabase Auth access token 전달, CoreHub의 Auth UID 확인 및 audience가 지정된 단기 ticket 발급, CoreNull ticket 교환과 기존 Owner mapping 조회 경로가 구현·배포된 것으로 §§1–10 및 관련 커밋 기록에 남아 있다. |
| 기존 Owner 보존 및 자동 생성·병합 금지 | **완료된 경계** | 기존 mapping이 있으면 기존 `owner_key`를 사용하고, mapping이 없으면 `owner_link_required`(409)로 거부하는 Path S 동작이 확인됐다. 이는 모든 프로젝트의 identity가 통합됐다는 뜻은 아니다. |
| Path S 기본 smoke test | **완료** | 정상 ticket의 cookie 설정, 만료/재사용 ticket 오류, Owner link 누락 시 409 결과가 기존 기록에서 확인됐다. 이후 전체 프로젝트 통합 E2E 완료와는 구분한다. |
| 공유 Supabase project ref 기록 | **사용자 확인 완료** | HajunAI·CoreHub·CoreNull의 Production ref가 `grlfocvlfatuvphkyivd`로 정렬됐다는 사용자의 확인을 §32에 기록했다. 설정을 이번 문서 갱신에서 독립 재검증한 것은 아니다. CoreRing까지 확인된 것은 아니다. |
| 통합 마스터 문서 복원 및 이력 점검 | **완료** | §31에 §§1–26 복원 근거와 Git 이력 감사가 기록돼 있다. 기존 원문과 번호 중복을 보존했다. |
| CoreNull/CoreHub outbox·Auth 계약 및 message-link 코드 읽기 전용 대조 | **조사 완료** | §§30, 33–35, 37–39, 41에서 지정된 코드·문서·PR 및 필드 흐름을 대조했다. 조사 결과는 미완료 구현을 확인한 것이며, producer 통합 완료를 뜻하지 않는다. |
| Production House/identity aggregate 확인 | **승인된 조회 완료** | §36의 aggregate-only SELECT가 실행됐고 count 결과가 기록됐다. 추가 row-level 조회나 변경은 하지 않았다. |
| 상호 ID·사람 단위 메시지 흐름의 기준 및 후속 branch 후보 기록 | **문서화 완료** | §§40–42에 사용자 기획 목적, 선택 브랜치 코드 대조 결과, 아직 검토하지 않은 원격 branch 후보를 구분해 기록했다. branch 후보 기록은 구현 확인이 아니다. |

### 43-2. 미완료·미검증 작업

| 항목 | 현재 상태 | 완료를 위해 필요한 확인 또는 결정 |
| --- | --- | --- |
| CoreRing ↔ CoreNull 상호 ID 생성·연결 | **미입증 / 별도 진행** | CoreRing 사용 시 CoreNull ID가 생성·연결되는 경로와 반대 방향 경로를 실제 관련 branch/API에서 확인해야 한다. 현재 조사한 `main` 코드에서는 양방향 crosswalk 구현을 입증하지 못했다. §42의 branch 후보는 아직 코드 검토 전이다. |
| 한 사람을 나타내는 프로젝트 간 canonical identity | **미완료** | Auth UID, CoreNull `owner_key`, CoreRing/HajunAI local/device ID를 같은 사람으로 연결하는 승인된 source of truth와 기존 mapping 경로가 확인되지 않았다. 키 이름이나 요청에 함께 실린 값만으로 동일 인물임을 추정하지 않는다. |
| HajunAI 메시지의 공통 사람 범위 연결 | **미완료 / 역할 구분 필요** | 자유 채팅 저장·질의 경로와 사용자가 직접 “마당에 남기기”를 실행하는 `post_message` 경로의 의도된 관계 및 CoreHub/HajunAI 분석 경로를 확인해야 한다. 현재 코드에서 두 경로가 CoreNull Owner와 같은 scope로 연결된다고 입증되지 않았다. |
| CoreNull Message outbox의 verified Auth/House 결속 | **보류** | 현재 Message write/outbox는 body `owner_key` 중심이며 verified Auth UID가 producer에 결속되지 않았다. `public.corenull_houses`와 `corenull.houses` 간 ID/owner_key 직접 match가 §36에서 0으로 관측됐고, 조사한 identity mapping도 canonical House와 연결되지 않았다. 임의 매핑·backfill로 해결하지 않는다. |
| Message 관계를 이용한 CoreHub 의미 연결 | **미완료** | comment의 `relations.parent_id`는 현재 조사된 outbox 경로에서 빠져 있다. `relations`, `run_id`, `start_post_id`, `fruit_message_id` 등이 payload에 보존되는 경우에도 현재 CoreHub detector가 이 키들을 명시적 edge로 소비한다고 확인되지 않았다. 메시지 관계 기반 의미화는 별도 검증이 필요하다. |
| CoreHub 수신 계약(PR #2 vs PR #3) | **미결 / 미승인** | PR #2의 Facts/device-event 경로와 PR #3의 전용 Message Event 경로는 저장 모델·인증 계약이 다르며 모두 draft다. 실제 수신 endpoint, 저장 모델, envelope, worker 인증, idempotency/replay 및 owner/house 검증을 하나의 승인된 계약으로 정리해야 한다. |
| CoreHub Facts/Opportunity와 HajunAI 인증 연결 | **미완료 / 계약 불일치** | Facts의 현재 owner_key 기반 경로와 Opportunities의 Bearer/Auth UID 기반 경로 사이, 그리고 HajunAI 호출부의 local/device identity와 보호된 API의 인증 요구 사이의 연결이 입증되지 않았다. |
| House ownership 및 Owner/member 범위 | **미결** | CoreNull의 public House/member write 모델과 `corenull.houses.owner_id` 기반 제안 모델 사이의 canonical 관계, owner-only인지 member까지 포함할지, Auth UID로 House 소유권을 증명하는 근거가 결정되지 않았다. |
| PR/ADR 승인 | **미완료** | brainpool-os PR #1, CoreHub PR #2/#3은 §37 확인 시점 open/draft 또는 제안 상태다. 공개 PR은 승인된 정책이나 구현으로 간주하지 않는다. |
| Staging 검증 및 통합 E2E | **보류** | disposable non-production fixture, synthetic data, 명시 승인, 정확한 endpoint·요청 수·부작용 범위가 먼저 정해져야 한다. 신규 저장, replay, payload conflict, 동시 replay, ownership 거부, commit/응답 유실 등을 검증해야 한다. |
| Producer 활성화 및 운영 적용 | **보류** | 위 identity·House·수신 계약·staging 검증이 완료되고 별도 승인을 받기 전까지 outbox producer 활성화, E2E 운영 호출, migration, backfill, DB/API 변경, merge/deploy를 진행하지 않는다. |
| Vercel 배포 보호 및 실제 런타임 노출 상태 | **미확인** | §27의 A+B 결정은 위험 기록과 별도 검토를 뜻하며 설정 변경이 아니다. 실제 Deployment Protection 및 handler 인증·인가 상태는 별도 소유자 확인이 필요하다. 정적 코드만으로 외부 노출이나 사고를 단정하지 않는다. |
| Message lineage의 canonical M0 및 불변성 | **미결** | §26의 lineage 후보 테이블과 source revision/append-only 보장 사이에 미해결 간극이 있다. canonical M0, 수정·삭제·rebirth의 원본 보존, privileged write 경계는 별도 확정이 필요하다. |

### 43-3. 다음 작업 순서

1. **기존 branch 후보부터 읽기 전용 대조:** §42에 기록된 CoreRing `feat/corering-handoff-receive`, HajunAI `feat/corering-handoff-button` 및 관련 identity/handoff branch를 확인한다. branch 이름만으로 완료 판정하지 않는다.
2. **상호 ID 경로의 실제 증거 확인:** CoreRing → CoreNull, CoreNull → CoreRing 각각의 호출 주체, API, 저장 mapping, 사용자 동작을 코드와 배포 근거로 연결한다.
3. **HajunAI 메시지 역할 확인:** 자유 채팅과 명시적 저장 메시지의 차이 및 각 메시지가 어느 서비스/사람 범위로 전달되는지 확인한다.
4. **메시지 관계 전달·소비 확인:** `comment`, `parent_id`, `run_id`, `start_post_id`, `fruit_message_id` 등 실제 관계 필드가 producer부터 CoreHub 의미 처리까지 유지되고 소비되는지 확인한다.
5. **그 이후에만 보안·수신 계약 게이트 진행:** verified identity/House scope, PR #2/#3 계약, staging 및 E2E를 별도 승인 경계 안에서 다룬다.

### 43-4. 작업 중단·재시작 방지 규칙

- 완료된 Path S 인증·Handoff를 새 통합 작업처럼 다시 구현하거나 재검증 루프로 되돌리지 않는다. 실제 장애 또는 새 증거가 있을 때만 해당 범위를 재개한다.
- 조사 완료된 §30–§42를 다시 처음부터 반복하지 않는다. 새로 확인할 branch/API/필드 범위를 먼저 특정하고, 기존 절의 결과와 차이만 기록한다.
- §42의 branch 목록은 조사 후보이며, 실제 구현 여부는 각 branch의 코드와 계약을 확인한 뒤 판정한다.
- 문서 갱신은 완료/미완료 상태를 명확히 하는 기록 작업이다. ADR 승인, schema 변경, PR 승인, Producer 활성화, staging/E2E 또는 Production 작업의 승인을 대신하지 않는다.
- 원본 기록은 보존한다. 기존 절의 과거 관측을 현재 상태로 덮어쓰지 않고, 변경된 사실은 새 날짜가 붙은 후속 절에 추가한다.

**현재 종합 판정:** HajunAI–CoreHub–CoreNull의 Path S 인증 Handoff는 기존 구현 및 기본 smoke test까지 완료된 기준 경로다. 그러나 BRAINPOOL 전체의 “한 사람·여러 프로젝트 ID·메시지 연결 기반 의미화” 통합은 아직 완료되지 않았다. 다음 초점은 새 설계나 재시작이 아니라 §42의 기존 branch 후보에서 상호 ID 경로와 HajunAI 메시지 흐름의 실제 구현 증거를 찾는 것이다.