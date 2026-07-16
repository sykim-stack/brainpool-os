# Impact Analysis Rules

본 문서는 커밋이 프로젝트 전체에 미치는 영향도를 평가하는 기준을 정의합니다.

## 1. 평가 영역 및 가중치
| 영역 | 평가 기준 | 가중치 |
| :--- | :--- | :--- |
| **Architecture** | 핵심 계약(`ctx`), 엔진 구조, 의존성 변경 | ★★★★★ |
| **Data** | DB 스키마, `Message` 구조, 관계(Relations) 변경 | ★★★★☆ |
| **API** | 외부 엔드포인트 추가/수정, 인터페이스 변경 | ★★★☆☆ |
| **UI/UX** | 사용자 인터페이스, 인터랙션 흐름 변경 | ★★☆☆☆ |
| **Documentation** | 지시서, 로드맵, 가이드 문서 업데이트 | ★★☆☆☆ |

## 2. 영향도 계산 예시
- **High Impact (★★★★★)**: `contracts/ctx.js` 수정, `Message` 타입 신설
- **Medium Impact (★★★☆☆)**: 새로운 API 라우트 추가, 엔진 내 로직 리팩토링
- **Low Impact (★☆☆☆☆)**: 단순 오타 수정, 스타일(CSS) 변경

## 3. 모듈별 연쇄 영향도 (Cascade Impact)
특정 모듈 변경 시 하위 의존 모듈에 미치는 영향을 고려합니다.
- **CoreRing 변경 시**: 하위 모든 모듈(CoreNull, CoreHub, HajunAI) 재검토 필요
- **CoreNull 변경 시**: CoreHub, HajunAI 영향도 체크
- **CoreHub 변경 시**: HajunAI 영향도 체크
