# BRAINPOOL HajunAI 사용 매뉴얼 v1.0

**작성**: 클로2 / **기준일**: 2026-07-20  
**상태**: Official Manual (Context OS Guide)

---

## 1. 시스템 구조 한눈에 보기
```text
마누스 (PM)
↓ 문서 업데이트
brainpool-os/doc/
↓ GitHub Push
↓
hajuncore-app (Vercel)
↓
Claude 세션 시작 → context_package 읽기
↓
철학 + 현황 + Knowledge = 완전한 맥락
```

## 2. 에이전트 시작 절차 (Context Injection)
새로운 AI 세션을 시작할 때 다음 명령을 사용하여 맥락을 주입하십시오.

### 클로2 (HajunAI 담당)
> "당신은 클로2입니다. https://hajuncore-app.vercel.app/api/hajun?action=context_package 이 URL을 읽고 작업을 시작하세요."

### 다른 에이전트 (클로3, 4, 5)
> "당신은 [역할명]입니다. https://hajuncore-app.vercel.app/api/docs?agent=claude2 이 URL을 읽고 작업을 시작하세요."

## 3. 주요 API 엔드포인트
- **맥락 패키지**: `GET /api/hajun?action=context_package` (통합 프롬프트 및 현황)
- **문서 조회**: `GET /api/docs?file=[파일명]` (GitHub 실시간 fetch)
- **개발 현황**: `GET /api/hajun?action=dev_contexts`
- **Knowledge Sync**: `GET /api/hajun?action=sync_snapshot&house_id=[UUID]`

## 4. 핵심 워크플로우
1. **마누스 문서 업데이트**: `brainpool-os/doc/` 수정 및 푸시.
2. **실시간 반영**: `/api/docs`가 GitHub에서 최신 내용을 실시간으로 가져옴.
3. **맥락 요약**: Dashboard에서 `Gemini 요약 실행`을 통해 `dev_contexts` 갱신.
4. **Knowledge 생성**: `house_snapshots` → `Knowledge Unit` 자동 변환 및 HajunAI 채팅 반영.

## 5. 데이터 레이어 (Derived Data Architecture)
- **Primary**: Messages (Single Source of Truth)
- **Derived L1**: `house_snapshots` (CoreNull/CoreHub)
- **Derived L2**: `Knowledge Units` (HajunAI)
- **Derived L3**: `Contexts` (HajunAI Person Understanding)

---
*본 매뉴얼은 BRAINPOOL OS의 모든 에이전트가 동일한 맥락을 공유하기 위한 표준 가이드입니다.*
