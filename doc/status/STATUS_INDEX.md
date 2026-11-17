# STATUS_INDEX — BRAINPOOL OS 통합 상태 단일 조회 기준

> **기준일**: 2026-11-18  
> **용도**: 현재 상태의 **단일 조회 기준**. 이 문서 1곳만 본다.  
> **규칙**: 상태와 근거가 충돌하면 원본 근거를 확인하고 이 인덱스를 정정한다.  
> **기존 문서**: 삭제하지 않는다. 상세 근거·이력은 기존 status 문서에 보존. 이 문서는 참조만 제공.

## 현재 상태 (2026-11-18)

### 통합 연결 (4-Core)

| 항목 | 상태 | 근거 문서 |
|---|---|---|
| 6개 필수 빈칸 | 전부 확정 | `17-connection-gaps-priority.md` |
| 코드 실행 1차 | 완료 (Hub A-4/A-5/PATCH 폐지 + CoreNull/CoreRing 라벨 자기화) | `38-verification-report.md` |
| A-8 계약 문서 | 완료 | `doc/directives/Core_Connection_Contract_v1.0.md` |
| ADR 3건 | 배치 완료 (CONNECT/IDENTITY/CONSUME-001) | `doc/adr/ADR-CONNECT/IDENTITY/CONSUME-001.md` |
| ADR-SEO-001 인용 정리 | 완료 (5곳 → clo5.md §SEO SOURCE RULE 참조) | `doc/contexts/clo5.md` |
| Push (5개 레포) | 완료 | 원격 `mes/integration-1` |
| Deploy (CoreHub) | 완료 | PATCH 405 `consume_not_supported` 라이브 확인 |
| 라이브 검증 | 완료 | GET facts 정상, GET opportunities auth_required |

### 남은 항목 (사람 결정)

| # | 항목 | 상태 | 필요 |
|---|---|---|---|
| ④ | A-10 (이 문서 자체 + 이벤트 기반 갱신) | Decision 1 확정, Decision 2·3 대기 | 갱신 주체·방식·주기 |
| action_type 마이그레이션 | probe 완료 (NOT NULL, default 없음) | (a) nullable / (b) 파생값 / (c) default 중 선택 |
| Push·배포 전 5개 결정 | 추천 제시 완료 | 사람 확정 |

### 인증 (Auth)

| 항목 | 상태 | 근거 |
|---|---|---|
| Auth 사용자 | 3명 | Supabase Auth |
| Owner identity 매핑 | 1건 | `corenull_owner_identities` |
| A-1 (x-owner-key 채우는 주체) | 코드 존재, 채우는 주체 공백 | Phase 1 device_fallback 허용 (영구 정체성 아님) |

### Core 상태

| Core | 브랜치 | 최신 커밋 | 비고 |
|---|---|---|---|
| brainpool-os | `mes/integration-1` | `59c44d4` | doc/ ADR 3건 + INDEX/DOC_INDEX + SEO 정리 |
| brainpool-corehub | `mes/integration-1` | `aafc370` | A-4 (action_type·payload.message 제거) + PATCH 폐지 |
| brainpool-corenull | `mes/integration-1` | `d1808cd` | A-5 라벨 자기화 |
| brainpool-clean | `mes/integration-1` | `ce975e8` | A-5 라벨 자기화 + A-1/A-2/A-7 |
| hajuncore-app | `mes/integration-1` | `f3760a2` | PATCH no-op + hermes fix |

## 기존 상태 문서 (상세 근거·이력)

| 문서 | 역할 |
|---|---|
| `DEV_CONTEXT_SUMMARY.md` | 개발 컨텍스트 요약 |
| `HERMES_PHASE1_PROGRESS_2026-10-23.md` | Hermes Phase 1 진행 |
| `CORENULL_ROADMAP.md` | CoreNull 로드맵 |
| `CORERING_STABILIZATION_2026-09-18.md` | CoreRing 안정화 |
| `BRAINPOOL_INTEGRATED_STRUCTURE_INVESTIGATION_v2_2026-09-28.md` | 통합 구조 조사 v2 |
| `HERMES_MES_BOUNDARY_LOCK_2026-11-15.md` | Hermes ↔ 메스 경계 잠금 |
| `HERMES_MES_CONNECTION_DESIGN_2026-11-15.md` | 하준아이 ↔ 메스 연결 설계 |

> 이 인덱스와 기존 문서가 충돌하면, **원본 근거(기존 문서)를 확인하고 이 인덱스를 정정**한다.

## 갱신 규칙 (A-10 Decision 2·3 확정 — 2026-11-18)

- **갱신 주체**: 메스 스크립트 작성 + CI/CD 웹훅 실행
- **갱신 주기**: Git push마다 갱신
- **자동화 경계**: 객관적 사실만 자동 갱신 (커밋 해시, 브랜치, 배포 상태). 의미 판단(해석·우선순위·결정)은 사람.
- **관리 책임**: 클로1이 결과와 문서 정합성 관리
- **갱신 방법**: push 웹훅 → 메스 스크립트가 STATUS_INDEX.md의 "현재 상태" 섹션을 갱신 → 자동 커밋 (또는 PR)

---

_이 문서는 A-10 Decision 1에 따라 신설되었다. Decision 2(갱신 주체·방식)와 Decision 3(갱신 주기)은 2026-11-18 확정._