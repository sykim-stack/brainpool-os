# BRAINPOOL OS 마스터 통합 문서 v2.1 (Constitution)

**작성자**: 클로 (설계 담당)  
**날짜**: 2026-07-16  
**상태**: Active (Single Source of Truth)

---

## 0. 개요 및 목적 (Documentation Mission)
> 문서는 프로젝트를 설명하기 위해 존재하지 않는다. 프로젝트가 시간이 지나도 같은 철학으로 진화하도록 보호하기 위해 존재한다.

본 문서는 BRAINPOOL OS의 최상위 헌법(Constitution)입니다. 모든 기여자(사람, AI 에이전트, 자동화 시스템)는 본 문서의 원칙을 절대적으로 준수해야 합니다.

## 1. 불변의 원칙 (Immutable Principles)
- **Human First**: AI는 분석하고 지원하며, 최종 결정은 사람이 한다.
- **Meaning First**: 데이터보다 의미와 맥락을 우선한다.
- **Single Source of Truth**: 모든 데이터의 근간은 하나로 유지된다. (`Message` 중심)
- **Core Independence**: 각 엔진은 독립적이며 최소한의 의존성을 가진다.
- **Evolution over Expansion**: 무분별한 확장보다 철학에 기반한 진화를 지향한다.
- **Documentation before Automation**: 자동화 이전에 문서화가 선행되어야 한다.

## 2. 핵심 파이프라인 (Pipeline Contract)
BRAINPOOL의 데이터는 다음 흐름을 따르며, 각 단계는 `ctx`를 매개로 연결됩니다.
`Message` → `Translation` → `Analysis` → `Knowledge` → `Meaning` → `CoreHub` → `Decision Support` → `Human Decision` → `Experience`

### Pipeline Contract Rules
- **Receives ctx / Returns ctx**: 모든 엔진은 `ctx`를 입력받아 처리된 `ctx`를 반환해야 합니다.
- **Never owns ctx**: 엔진은 `ctx`의 소유권을 가지지 않으며, 불변성을 유지해야 합니다.
- **Allowed Flow**: 명시된 파이프라인 순서에 따른 데이터 전달.
- **Forbidden Flow**: `throw` 사용, 엔진 간 직접적인 데이터 소유권 주장, `ctx` 직접 수정(Mutation).

## 3. 데이터 및 아키텍처 (Source of Truth)
- **Primary Data**: `Message` (모든 콘텐츠의 단일 단위)
- **Derived Data**: `tb_trans_logs` (언어), `house_snapshots` (삶), `opportunities` (운영)
- **Ownership**: 하나의 데이터는 반드시 하나의 Owner(Engine)만 가진다.

## 4. 에이전트 체계 및 책임 (Organization)
| 에이전트 | 담당 영역 | 역할 정의 |
| :--- | :--- | :--- |
| **클로1** | 총괄 | 프로젝트 비전 유지, 최종 의사결정 (Constitution 관리) |
| **클로2** | 하준아이 | Mind Layer 설계 및 UI 가이드 (Understanding Layer) |
| **클로3** | 코어널 | Life Knowledge Engine (삶의 기록, 씨앗 시스템) |
| **클로4** | 코어헙 | 운영 관리 (키워드, 볼트, 점수 엔진) |
| **클로5** | 코어링 | Language Knowledge Engine (번역 및 분석) |
| **마누스 (PM)** | 관리 | 프로젝트 상태 분석, 아키텍처 린터, PM Guard 역할 |

## 5. 의사결정 권한 (Decision Ownership)
| 영역 | Decision Owner |
| :--- | :--- |
| Constitution / Core Responsibility | Architecture |
| Business Priority | Planning |
| Repository Layout | Platform |
| Automation Rules | Governance |
| ADR Approval | Architecture + Planning |

## 6. 예외 정책 (Exception Policy)
예외는 허용될 수 있으나, 다음 조건을 모두 만족해야 합니다.
1. ADR 기록 필수
2. 영향도 분석 수행
3. Decision Owner의 최종 승인
*예외는 결코 새로운 원칙이 될 수 없습니다.*

---
## Applicability 선언
본 헌법의 원칙은 Human Contributors, AI Agents, Automation, Documentation, Repositories, Database Architecture 모두에 동일하게 적용됩니다.
