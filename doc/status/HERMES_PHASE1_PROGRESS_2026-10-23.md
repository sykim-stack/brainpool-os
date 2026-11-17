# Status — Hermes Phase 1 진행 (2026-10-23)
> **상태 조회 기준**: [STATUS_INDEX.md](./STATUS_INDEX.md) — 현재 상태는 이 문서 1곳만 본다.

_PM: Grok_  
_계획: `HERMES_PHASE1_PLAN_2026-10-23.md`_

## 열린 질문 → 권장 고정

| 질문 | 결정 |
|------|------|
| 제안 면 | **본챗 UI** (assistant 버블 하단) |
| 이해 갱신 | **구현됨** (2026-11-16 갱신) — `lib/synthesizeUnderstanding.ts`가 관제·개발·브라이언풀 마당 메시지 + Knowledge Unit을 종합해 `contexts.understanding`을 갱신 |
| 승인 이력 | 별도 저장 없음. 남김은 기존 `post_message` 경로만 |

## 구현 (hajuncore-app `main`)

- `app/chat/page.tsx`  
  - chat 응답 `hermes`를 메시지에 보관  
  - `hasActionUnit`일 때만 **Hermes 제안 · 실행 아님** 블록 표시  
  - **남김 제안 받기** → 마당 패널 원문 채움 + 상태 안내 (write 없음)  
  - **확인 질문 초안** → 입력창 초안만 (전송은 사람)  
  - **사람 트리거 실행 경로** → `메스:` 접두어로 요청, 도달 시에만 실행 버튼 렌더 (경계·제약: `HERMES_MES_BOUNDARY_LOCK_2026-11-15.md`)  
- 커밋: `2cd8409` · typo fix `b3add1a`

## 아직 아님 (계획 Done 미달)

- Production 배포 후 UI 수동 확인  
- 이해 갱신 / 연결 승인 면  
- 승인 이력 전용 저장

## 한 줄

**제안이 chat에 보이고, 남김·확인질문은 사람 손으로만 기존 경로에 이어진다.**
