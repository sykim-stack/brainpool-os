# PM Automation Workflow

본 문서는 Git Push 이후 수행되는 자동 분석 및 반영 절차를 정의합니다.

## [Step 1] Git Push & Trigger
- 사용자가 코드를 원격 저장소에 `push` 합니다.
- GitHub Action이 트리거되어 분석 환경을 구성합니다.

## [Step 2] Objective Data Collection
- 변경된 파일 목록(Files Changed) 수집
- 커밋 메시지 및 Diff 분석
- 관련 ADR 및 Issue 추적

## [Step 3] PM AI (Manus) Analysis
- **에이전트 분류**: 누가 작업했는가?
- **아키텍처 린팅**: 철학을 준수했는가?
- **영향도 평가**: 프로젝트에 얼마나 중요한 변화인가?
- **맥락 업데이트**: 현재 진행률은 어떻게 변했는가?

## [Step 4] Suggestion Generation
- `STATUS.md` 업데이트 제안
- `ROADMAP.md` 체크박스 및 진행률 제안
- 다음 작업 우선순위 추천

## [Step 5] Human Review & Approval
- 프로젝트 총괄(클로1) 또는 사람이 제안 내용을 검토합니다.
- 내용이 적절할 경우 승인(Approve)합니다.

## [Step 6] Document Reflection
- 승인된 내용이 실제 문서에 반영됩니다.
- 모든 과정은 `CHANGELOG.md`에 기록됩니다.
