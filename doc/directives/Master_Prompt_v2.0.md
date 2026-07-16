# BRAINPOOL OS 마스터 통합 문서 v2.0 (Constitution)

**작성자**: 클로2 (설계 담당)  
**날짜**: 2026-07-16  
**상태**: Active (Single Source of Truth)

---

## 0. 개요 및 목적 (Documentation Mission)
> 문서는 프로젝트를 설명하기 위해 존재하지 않는다. 프로젝트가 시간이 지나도 같은 철학으로 진화하도록 보호하기 위해 존재한다.

본 문서는 BRAINPOOL OS의 최상위 헌법(Constitution)입니다. 모든 기여자(사람, AI 에이전트, 자동화 시스템)는 본 문서의 원칙을 절대적으로 준수해야 합니다.

## 1. 불변의 원칙 (Immutable Principles)
- **Human First**: AI는 분석하고 지원하며, 최종 결정은 사람이 한다.
- **Meaning First**: 데이터보다 의미와 맥락을 우선한다.
- **Single Source of Truth**: 모든 데이터의 근간은 하나로 유지된다.
- **Core Independence**: 각 엔진은 독립적이며 최소한의 의존성을 가진다.
- **Evolution over Expansion**: 무분별한 확장보다 철학에 기반한 진화를 지향한다.
- **Documentation before Automation**: 자동화 이전에 문서화가 선행되어야 한다.

## 2. 핵심 파이프라인 (Pipeline Contract)
BRAINPOOL의 데이터는 다음 흐름을 따르며, 각 단계는 `ctx`를 매개로 연결됩니다.
`Message` → `Translation` → `Analysis` → `Knowledge` → `Meaning` → `CoreHub` → `Decision Support` → `Human Decision` → `Experience`

### Allowed & Forbidden Flow
- **Allowed**: `(ctx) => ctx` 계약 준수, `_error` 필드를 통한 에러 전달.
- **Forbidden**: `throw` 사용, 엔진 간 직접적인 데이터 소유권 주장, `ctx` 직접 수정(Mutation).

## 3. 데이터 및 아키텍처 (Source of Truth)
- **Primary Data**: `Message` (모든 콘텐츠의 단일 단위)
- **Derived Data**: `tb_trans_logs` (언어), `house_snapshots` (삶), `opportunities` (운영)
- **Ownership**: 하나의 데이터는 반드시 하나의 Owner(Engine)만 가진다.

## 4. 의사결정 권한 (Decision Ownership)
| 영역 | Decision Owner |
| :--- | :--- |
| Constitution / Core Responsibility | Architecture |
| Business Priority | Planning |
| Repository Layout | Platform |
| Automation Rules | Governance |
| ADR Approval | Architecture + Planning |

## 5. 예외 정책 (Exception Policy)
예외는 허용될 수 있으나, 다음 조건을 모두 만족해야 합니다.
1. ADR 기록 필수
2. 영향도 분석 수행
3. Decision Owner의 최종 승인
*예외는 결코 새로운 원칙이 될 수 없습니다.*

---
## Applicability 선언
본 헌법의 원칙은 Human Contributors, AI Agents, Automation, Documentation, Repositories, Database Architecture 모두에 동일하게 적용됩니다.
