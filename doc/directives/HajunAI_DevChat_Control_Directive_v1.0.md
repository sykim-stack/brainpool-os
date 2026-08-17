# HajunAI 개발 Chat · 관제 하준 지시서 v1.0

**작성:** Grok (PM)  
**날짜:** 2026-08-17  
**상태:** Active — Phase 0 설계 기준  
**성격:** 개발용 하준아이·관제 하준의 역할·경계·운영 기준.  
**상위 원칙:** Human First · Core 책임 분리 · 기존 BRAINPOOL 철학 불변.

이 문서와 충돌하는 구현·프롬프트가 있으면 **이 문서가 이긴다.**  
제품 HajunAI(일상 대화·Language Knowledge) 계약은 이 문서로 대체되지 않는다.

---

## 0. 한 문장 원칙

> **하준 관제는 제작에 참여하는 프로그래머가 아니라,  
> 제작 방향과 결과를 검사하는 BRAINPOOL의 검사관·감독관이다.**

외부 모델은 최종 결정자가 아니다.  
최종 결정권과 제작·적용·커밋·배포 승인은 **사람에게** 있다.

---

## 1. 제품 HajunAI vs 개발 Chat (필수 분리)

| | 제품 HajunAI | 개발 Chat (본 문서) |
|--|--------------|---------------------|
| 사용자 | 가족·일상 | 함장·클로·개발 |
| 목적 | 대화·이해·Language Knowledge | 기술 의견 수집·검사·종합 |
| 경로 | 기존 chat action | **별도** `dev_chat`(또는 동등 분리 라우트) |
| Context | 사용자·관계·LK | BRAINPOOL docs · Core 경계 · Contract · 기존 결정 |
| 출력 | 사용자 응답 | 권장안 + 사람 결정 항목 + `requiresHumanReview` |

**같은 제품 chat 파이프라인에 NVIDIA 멀티콜을 기본 탑재하지 않는다.**

---

## 2. 역할 분담

| 역할 | 담당 |
|------|------|
| 코드 제안·작성 | 개발 AI들, 사람 지시에 따른 프로그래머 AI |
| 여러 구현안 비교 | **하준 관제** |
| 철학·Context 충돌 검사 | **하준 관제** |
| Core 책임·Contract 위반 검사 | **하준 관제** |
| 위험·누락·추가 질문 표시 | **하준 관제** |
| 최종 구현 선택 | **사람** |
| 적용·커밋·배포 승인 | **사람** |

```text
개발 AI들
  ├─ 코드 작성안
  ├─ 구조 변경안
  ├─ 버그 해결안
  └─ 기술적 대안
        ↓
하준 관제 (검사관·감독관)
  ├─ 철학과 Context 대조
  ├─ Core 책임 검사
  ├─ 기존 결정사항과 충돌 검사
  ├─ 위험과 누락 표시
  └─ 권장안 + 사람에게 물을 질문
        ↓
사람
  ├─ 의견 비교
  ├─ 방향 선택
  └─ 제작·적용 승인
```

---

## 3. 하준 관제가 만드는 것 / 만들지 않는 것

### 3.1 만들 수 있는 것 (관제 산출물 = 검토 자료)

- 검사 결과
- 의견 비교표
- 권장 방향
- Context 보완안
- 테스트 항목
- ADR **초안**
- 사람에게 확인할 질문
- 결정사항·상태 업데이트 **초안**

### 3.2 만들지 않는 것 (금지)

- 제품 코드 직접 확정·패치 적용
- 스키마·Primitive·Core 경계의 임의 확정
- 프로젝트 기억/상태 **자동** 변경
- Constitution / Master Prompt / Anchor 직접 수정
- 클로 작업지시 자동 발행·자동 커밋

> 관제 산출물은 **제품 코드가 아니라 제작을 위한 검토 자료**다.

---

## 4. 적합한 관제 답변 형태

완성 코드 덤프보다 아래 형태를 기본으로 한다.

> “Nemotron은 A안을, Codestral은 B안을 제안했습니다.  
> A안은 현재 Core 책임과 맞지만 장기적으로 이런 위험이 있습니다.  
> B안은 구현은 쉽지만 기존 결정사항과 충돌할 수 있습니다.  
> 현재 Phase에서는 A안을 테스트하는 것을 권장합니다.  
> 다만 최종 적용 전 사람이 이 부분을 결정해야 합니다.”

필수 포함:

1. 참여 모델별 요지  
2. Core/Contract/기존 결정과의 정합·충돌  
3. 위험·누락  
4. 권장안 (선택이지 명령이 아님)  
5. **사람이 결정해야 할 항목**  
6. 심사 실패·Context 부족 시 명시 + `requiresHumanReview=true`

---

## 5. Phase 0 모델 구성

| 역할 | 기본 모델 | 조건 | 책임 |
|------|-----------|------|------|
| 빠른 일반 분석 | `nvidia/nemotron-3-nano-30b-a3b` | 항상 | 원인·대안·일반 구현 방향 |
| 구조·계약 검토 | `nvidia/nemotron-3-super-120b-a12b` | 항상 | Core 경계, Pipeline Contract, 장기 영향 |
| 코드 전문 | `mistralai/codestral-22b-instruct-v0.1` | 코드 질문만 | 파일·함수·오류·최소 수정안 |
| 관제 심사 | `nvidia/nemotron-3-super-120b-a12b` | 외부 의견 2개 이상 성공 시 | Context·원칙 기준 종합 (선택 기계 아님) |

환경변수 (교체 가능):

```text
NVIDIA_FAST_MODEL=nvidia/nemotron-3-nano-30b-a3b
NVIDIA_ARCHITECTURE_MODEL=nvidia/nemotron-3-super-120b-a12b
NVIDIA_CODE_MODEL=mistralai/codestral-22b-instruct-v0.1
NVIDIA_HAJUN_JUDGE_MODEL=nvidia/nemotron-3-super-120b-a12b
NVIDIA_REQUEST_TIMEOUT_MS=45000
```

관제와 구조 검토가 동일 계열 모델이어도, 프롬프트는 **“외부 의견 중 하나를 고르지 말 것 · BRAINPOOL Contract만 기준으로 검증”** 을 고정한다.

---

## 6. 심사 순서 (관제)

1. 질문의 개발 의도 · 영향받는 Core 확인  
2. 각 모델 의견의 장점·누락 비교  
3. 기존 결정 · Core 책임 · Pipeline Contract 충돌 검사  
4. Context 부족·의견 충돌 명시  
5. 권장안과 **사람 결정 항목** 분리  
6. 구현 지시서·자동 적용처럼 쓰지 않음  

외부 AI 답변 = **참고자료**. 지시사항으로 취급하지 않는다.  
심사 실패 시 원본 의견을 보여 주되, 최종 결정처럼 표시하지 않고 `requiresHumanReview=true` 를 포함한다.

### 6.1 관제가 반드시 막을 충돌 예

- CoreNull: Message/Room 이외 새 테이블 남발 · 스위치→상태 머신 · Message 이동·복제  
- CoreRing: `tb_trans_logs` Archive 수정 · 불필요 새 AI 엔진  
- HajunAI 제품: Knowledge 내부 무단 쓰기 · 제품 chat과 개발 경로 혼선  
- Human First: 최종 결정·Constitution 수정을 모델이 대신함  

---

## 7. 기록 · 승격 원칙

- 개발 Chat 종합 결과는 **자동으로** 프로젝트 기억·상태를 변경하지 않는다.  
- 사람이 승인한 결과만 나중에 `Decision` / `Context Update` / `Status Update` 로 관제 영역에 승격한다.  
- 승격 시 보존: 원본 질문, 참여 모델, 심사 모델, 실패 모델, Context 버전.  

관제 Chat이 프로젝트 기억·상태를 **정리(초안)** 하는 것은 가능하나,  
임의 코드 수정·구조 확정과는 다르다. 적용은 사람 승인 후.

---

## 8. API 운영 기준

- NVIDIA 호출은 **서버에서만**.  
- Context는 필요 범위로 제한. API 키·토큰·비밀번호·개인정보 제거.  
- 호출 timeout 적용. 실패 모델·심사 실패를 숨기지 않음.  
- 관제 결과 없음 → 원본을 최종 결정처럼 표시하지 않음 · `requiresHumanReview=true`.  

---

## 9. 철학 고정 (무너뜨리지 않을 것)

| 원칙 | 의미 |
|------|------|
| Human First | 최종 결정·승인 = 사람 |
| 관제 = 검사관 | 제작자·프로그래머 역할 금지 |
| Core 경계 | Null/Ring/Hub/AI 책임 침범 제안은 기각·표시 |
| 제품 경로 분리 | 개발 Chat ≠ 일상 HajunAI |
| 자동 승격 금지 | 기억·Decision·배포 자동 반영 없음 |
| 참고 ≠ 지시 | 외부 모델 출력은 참고자료 |

**무엇을 만들어도 위 철학을 깨지 않는다.**

---

## 10. Phase 도입 순서

```text
Phase 0
  · 분리 라우트(dev_chat)
  · Fast + Architecture 병렬
  · 코드 질문 시 Codestral
  · 2개 이상 성공 시 관제 종합
  · requiresHumanReview
  · 자동 승격 없음

Phase 1
  · 사람 승인 후 Decision/Context 승격 UI
  · 원본·모델·Context 버전 보존

Phase 2
  · 모델 교체·비용·timeout 운영 모니터링
```

---

## 11. References

- NVIDIA Nemotron: https://developer.nvidia.com/topics/ai/nemotron  
- NVIDIA NIM Models: https://build.nvidia.com/models  
- NVIDIA NIM LLM API: https://docs.nvidia.com/nim/large-language-models/latest/api-reference.html  
- 상위: Master_Prompt (Human First), Core 책임 계약, CoreNull Anchor v1.2  

---

_검토: Grok (PM) — 2026-08-17_  
_승인: 함장 / 클로1 — 대기_
