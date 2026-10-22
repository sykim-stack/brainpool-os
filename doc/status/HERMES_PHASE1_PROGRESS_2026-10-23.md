# Status — Hermes Phase 1 진행 (2026-10-23)

_PM: Grok_  
_계획: `HERMES_PHASE1_PLAN_2026-10-23.md`_

## 열린 질문 → 권장 고정

| 질문 | 결정 |
|------|------|
| 제안 면 | **본챗 UI** (assistant 버블 하단) |
| 이해 갱신 | Phase 1 전반에서는 **미착수** (남김·확인질문 우선) |
| 승인 이력 | 별도 저장 없음. 남김은 기존 `post_message` 경로만 |

## 구현 (hajuncore-app `main`)

- `app/chat/page.tsx`  
  - chat 응답 `hermes`를 메시지에 보관  
  - `hasActionUnit`일 때만 **Hermes 제안 · 실행 아님** 블록 표시  
  - **남김 제안 받기** → 마당 패널 원문 채움 + 상태 안내 (write 없음)  
  - **확인 질문 초안** → 입력창 초안만 (전송은 사람)  
- 커밋: `2cd8409` · typo fix `b3add1a`

## 아직 아님 (계획 Done 미달)

- Production 배포 후 UI 수동 확인  
- 이해 갱신 / 연결 승인 면  
- 승인 이력 전용 저장

## 한 줄

**제안이 chat에 보이고, 남김·확인질문은 사람 손으로만 기존 경로에 이어진다.**
