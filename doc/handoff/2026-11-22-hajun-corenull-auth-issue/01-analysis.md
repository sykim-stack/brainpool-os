# HajunAI ↔ CoreNull 인증 연결 이슈 분석

**작성:** Mes (Hermes)  
**기준 시각:** 2026-11-22 01:47 KST  
**범위:** HajunAI CoreNull 버튼 인증 실패 → CoreHub 세션 부재 → Identity 매핑 불일치  
**배포 현황:** HajunAI `b5c8220`, CoreNull `2888653`, CoreHub `932cd90` (모두 Production READY)

---

## 1. 현상 요약

| 현상 | 상세 |
|---|---|
| **사용자 행동** | HajunAI 대시보드에서 "CoreNull 연결" 버튼 클릭 |
| **발생 오류** | `공유 인증 세션이 없습니다. 먼저 인증된 Core에서 시작해 주세요.` (401 auth_required) |
| **핵심 원인** | Hajun 요청에 **CoreHub Bearer 토큰도 `corehub_session` 쿠키도 없음** → CoreHub 요청 전 401 종료 |
| **Handoff 티켓** | **발급되지 않음** (Hajun 측에서 차단됨) |

---

## 2. 코드 레벨 확인된 사실

### HajunAI (`hajuncore-app`)

| 파일/경로 | 동작 |
|---|---|
| `/api/auth/handoffs` (POST) | `audience: corenull` 전달 |
| 인증 검증 로직 | 요청 헤더 `Authorization: Bearer <token>` **또는** 쿠키 `corehub_session`만 확인 |
| 둘 다 없으면 | **즉시 401 반환** — CoreHub 호출 안 함 |
| 세션 획득 경로 | **현재 배포본에 유효한 경로 불명** (기존 로그인 흐름에서 CoreHub 토큰 발급/저장 로직 확인 필요) |

### CoreNull (`brainpool-corenull`)

| 파일/경로 | 동작 |
|---|---|
| `/auth/handoff` (GET) | Handoff 티켓 교환 → `auth_user_id → owner_key` 연결 조회 |
| 연결 없으면 | `owner_link_required` 반환 — **Owner 생성/병합 안 함** |
| 직접 Google 로그인 | `localStorage.corenull_owner_key` → `current_owner_key`로 전달 |
| Identity 매핑 | 기존 매핑 있으면 기존 키 반환, 충돌 시 `IDENTITY_CONFLICT`, 매핑 없으면 현재 키에 연결 |

### CoreHub (`brainpool-corehub`)

| 상태 | 비고 |
|---|---|
| Handoff 발급/교환 코드 | Production에 배포됨 (`2fa1882` 선행 배포 후 후속 커밋들) |
| 현재 Production | `932cd90` |

---

## 3. Identity 매핑 불일치 (2026-11-22 01:28 기준)

| 제공된 행 | 매핑된 Owner Key |
|---|---|
| Google `…4026` | `47c7…` |
| Google `…7501` | `e35f…` |
| Supabase Auth `…dd98` | `e35f…` |
| Supabase Auth `…06e` | `47c7…` |

**사용자 주장:** "두 계정 모두 앱에서 `47c7…` 집(2채)을 본다"

**불일치:** Identity 테이블상 두 Google 계정은 **서로 다른 Owner**에 매핑됨.  
→ **DB 매핑 vs 브라우저 화면** 중 어느 쪽이 맞는지 미확정.

---

## 4. 집 데이터 미확인 사항

| 이슈 | 상태 | 확인 필요 사항 |
|---|---|---|
| SNL 어린이 수영장 집 삭제 여부 | 미확정 | `corenull_houses`에서 두 Owner 키별 행 조회 필요 |
| 한 Owner에 집 2채 존재 여부 | API는 지원, 화면은 최신 1채만 표시 | `/me/house` 화면이 최신 1채만 보여주는 것인지 확인 |
| 브라우저 `localStorage` 영향 | 가능성 있음 | `corenull_owner_key`가 Google 로그인 요청에 전달되어 화면에 영향 줄 수 있음 |

---

## 5. 블로커 우선순위

| 순위 | 블로커 | 해결 선행 조건 |
|---|---|---|
| **1** | **Hajun에 유효한 CoreHub 세션/토큰 없음** | 기존 로그인 흐름에서 CoreHub 토큰 발급·저장 경로 확인 |
| **2** | **Identity 매핑 불일치** | 동일 identity 테이블 재조회 + `corenull_houses` 행 대조 |
| **3** | **SNL 집 실존 여부** | 집 행 조회로 삭제 여부 확정 |
| **4** | **브라우저 화면 vs DB 차이** | `/me/house` 화면 로직 확인 + 별도 브라우저 프로필 테스트 |

---

## 6. 안전 원칙 준수 현황 (경계 잠금 2026-11-15)

| 원칙 | 적용 여부 |
|---|---|
| 조사(읽기)=자동 전달 | ✅ 읽기 전용 SQL·코드 조사만 수행 |
| 수정(쓰기)=사람 승인 후만 | ✅ DB 변경, 매핑 수정, Owner 병합, 재배포 **안 함** |
| 하준아이↔메스 자동화 착수=통합작업 종료 후 | ✅ 본 이슈는 인증 연결 선행 과제로 분리 |
| "실행"=write, doc/·타 레포 무수정 | ✅ 텍스트 핸드오프만 생성 |

---

## 7. 읽기 전용 검증 쿼리 (승인 후 실행)

```sql
-- 1) 두 Owner의 집 현황
select title, owner_key, created_at
from public.corenull_houses
where owner_key in (
  '47c7e5c4-0174-4e69-994a-58479d959406',
  'e35fa248-31cd-4082-95d9-d07875de5e2b'
)
order by owner_key, created_at desc;

-- 2) Identity 매핑 재확인 (동일 시점)
select identity_provider, identity_value, owner_key, created_at
from public.corenull_identity_mappings
where owner_key in (
  '47c7e5c4-0174-4e69-994a-58479d959406',
  'e35fa248-31cd-4082-95d9-d07875de5e2b'
)
order by owner_key, identity_provider;
```

---

## 8. 다음 액션 (우선순위 순)

| # | 액션 | 담당 | 비고 |
|---|---|---|---|
| 1 | Hajun 로그인/세션 코드 추적: CoreHub 토큰 어떻게 얻는지 | Mes / 클로2 | `/api/auth/*`, `lib/auth*.ts` 중심 |
| 2 | 위 SQL 실행 → Identity·집 행 대조 | 사용자 승인 후 Mes | Supabase 콘솔 또는 CLI |
| 3 | `/me/house` 화면 로직 확인: 최신 1채만 표시하는지 | 클로3 | CoreNull 프론트엔드 |
| 4 | 별도 브라우저 프로필로 계정별 로그인 테스트 | 사용자 | 브라우저 저장값 삭제 없이 |
| 5 | CoreHub 토큰 발급/전달 플로우 문서화 | 클로4 | handoff 선행 조건 정리 |

---

## 9. 미해결·미검증 항목 (명시적 표시)

- ❌ **Hajun에서 CoreHub 토큰 획득 경로 존재 여부** — 코드상 확인 안 됨
- ❌ **두 Google 계정이 실제 DB에서 같은 Owner 가리키는지** — identity 재조회 필요
- ❌ **SNL 집 삭제 여부** — 집 행 조회 필요
- ❌ **브라우저 `localStorage`가 화면 불일치 원인인지** — 별도 프로필 테스트 필요
- ❌ **CoreRing 연계 영향** — CoreNull handoff 정상화 전까지 보류 (원칙 준수)

---

## 10. 참조 커밋·배포

| 레포 | 커밋 | Production URL |
|---|---|---|
| hajuncore-app | `b5c8220` | https://hajuncore-app.vercel.app/ |
| brainpool-corenull | `2888653` | https://corenull.vercel.app/ |
| brainpool-corehub | `932cd90` | (CoreHub Production) |

---

**작성자:** Mes (Hermes)  
**목적:** 다음 작업자(클로2/클로3/클로4 등)가 즉시 상황을 파악하고 이어받을 수 있도록 함  
**원칙:** 추측 금지, 확인된 사실만 기록, 미확인은 미확인으로 표기