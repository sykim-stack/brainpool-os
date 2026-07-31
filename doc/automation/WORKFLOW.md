# PM Automation Workflow (v2.0)
_기준일: 2026-08-01_
_PM: Grok_

본 문서는 BRAINPOOL OS의 AI 협업 운영 모델과 Git Push 이후의 반영 절차를 정의한다.

## 핵심 원칙

> AI가 대화를 기억하는 것이 아니라, **시스템이 상태를 기억하도록** 만든다.

GitHub Commit / Document / ADR / Context는 단순 개발 관리 도구가 아니라 **AI 협업의 기억 구조**이다.

## 운영 순환 구조

```
AI Agent (클로)
    ↓
작업 수행
    ↓
Git Commit                    ← 상태 변화 이벤트
    ↓
PM 분석
    ├── 변경 내용 분석
    ├── Architecture 영향 확인
    ├── Drift Detection (Constitution / Core 경계 / 기존 결정)
    ↓
ADR / Context / 문서 반영 (푸시)
    ↓
Knowledge Accumulation
    ↓
다음 Agent가 Commit History로 맥락 파악
```

## Step-by-Step

### [Step 1] Git Commit & Push
- 클로가 작업을 완료하면 Commit으로 남긴다.
- Commit 메시지에 변경의 의도와 범위를 명확히 남긴다.

### [Step 2] PM Analysis (상태 변화 이벤트 처리)
PM은 다음을 수행한다:
- **에이전트 분류**: 누가 작업했는가?
- **아키텍처 린팅**: Constitution / Pipeline Contract / Core Independence 준수 여부
- **영향도 평가**: 어떤 Context / ADR / 문서에 영향을 주는가?
- **맥락 업데이트**: 현재 진행 상태가 어떻게 변했는가?

### [Step 3] Document Reflection
- 필요한 문서를 즉시 갱신하고 푸시한다.
- 특히 `doc/status/DEV_CONTEXT_SUMMARY.md`를 최신 상태로 유지한다.

### [Step 4] Knowledge Handover
- 다음 클로/사람은 긴 브리핑 대신 **Commit History + 최신 Context 문서**만으로 상태를 파악할 수 있어야 한다.

## PM 역할 정의

1. **Context Guardian** — 현재 프로젝트 상태를 문서와 Git 히스토리로 유지
2. **Drift Detection** — Constitution, Core 경계, 기존 결정과의 충돌 감시
3. **Knowledge Synchronization** — 각 클로의 결과를 공통 맥락으로 연결

## 제약 (PM Guard)
- Master Prompt 직접 수정 금지
- Pipeline Contract 변경 금지
- Source of Truth 임의 변경 금지
- ADR 없는 아키텍처 수정 제안 금지

---
*이전 버전(v1)의 GitHub Action 자동 트리거 부분은 추후 자동화 기반으로 재도입한다. 현재는 PM이 직접 분석·반영하는 방식을 우선한다.*
