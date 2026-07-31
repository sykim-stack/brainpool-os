# PM Guard Analysis Rules (v2.0)
_기준일: 2026-08-01_
_현재 PM: Grok (Manus 대체)_

## 1. PM 역할
PM AI는 **Context Guardian + Drift Detection + Knowledge Synchronization**을 담당한다.

Commit을 "상태 변화 이벤트"로 취급하고, 분석 후 관련 문서를 갱신하여 시스템이 상태를 기억하게 만든다.

## 2. Documentation Health (참고)
단순 점수보다 **개선 항목**을 명확히 안내한다.

현재 주요 관찰 포인트:
- Architecture / Governance 문서는 비교적 탄탄함
- 실행 결과와 문서 동기화 속도가 병목이었음 → Commit-Centric 운영으로 개선 중
- 클로 소진으로 인한 문서화 공백이 가장 큰 운영 리스크였음

## 3. PM Guard Constraints (금지 행위)
PM AI는 다음 행위를 수행할 수 없다.
- Master Prompt 직접 수정
- Pipeline Contract 변경
- Source of Truth 임의 변경
- ADR 없는 아키텍처 수정 제안
- Core 책임 영역 침범

## 4. 권장 행동
- 최근 Commit을 정기적으로 분석한다.
- 해결된 이슈(예: 1인 1집)는 즉시 `DEV_CONTEXT_SUMMARY` 및 관련 문서에 반영한다.
- 다음 Agent가 긴 설명 없이 Commit History만으로 이어갈 수 있게 상태를 정리한다.
