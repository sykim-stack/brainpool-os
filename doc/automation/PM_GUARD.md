# PM Guard Analysis Rules (v1.1)

## 1. Documentation Health Score
단순 점수 표시가 아닌, 개선 항목을 명확히 안내합니다.

| Category | Score | Status | Critical/Warning Issues |
| :--- | :--- | :--- | :--- |
| **Architecture** | 92 | Warning | Master Prompt 링크 누락 |
| **Data Contract** | 100 | Pass | - |
| **Governance** | 85 | Critical | ADR 미작성 구조 변경 감지 |

## 2. PM Guard Constraints
PM AI는 다음 행위를 수행할 수 없으며, 위반 시 시스템에 의해 차단됩니다.
- Master Prompt 직접 수정
- Pipeline Contract 변경
- Source of Truth 임의 변경
- ADR 없는 아키텍처 수정 제안
