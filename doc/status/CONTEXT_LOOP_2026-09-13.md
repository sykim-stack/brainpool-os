# Status — 맥락 연결 본선 (2026-09-13)

_PM: Grok_  
_범위: 브라이언풀 · 관제 · 개발 마당 맥락 이어가기_

## 오늘 닫은 것

1. **소유권** — ADR-CONTEXT-000 확정  
   원본=Core, 이해=HajunAI, contexts=현재 이해 상태

2. **구현** — synthesize → contexts → chat 주입  
   - 소스: Knowledge Unit + gwanje / gaebal / brainpool 의미 메시지  
   - `last_synthesized_at` 채움 확인  
   - chat에 `HajunAI 현재 이해` 블록 주입

3. **LLM 정렬** — chat 우선순위 NVIDIA → Groq → Gemini  
   (관제·개발 마당 NVIDIA 사용과 맞춤. Groq 키 model_not_found 우회)

4. **병렬 완료(사용자)** — 상품등록마당  
   본선과 분리. 계약·마이그레이션은 hajuncore-app `docs/` 참고

## 의도적 미구현

- Self Context
- contexts를 Core가 직접 쓰기
- summarize_context 복원 (synthesize 사용 권장)

## 다음 후보 (우선순위 아님, 메모)

- understanding 문장 품질 / 구버전 KU 잔재(context_package 언급 등) 정리
- 의미 있는 KU 생성 시점의 자동 synthesize 트리거
- Groq 키·플랜 정리 또는 완전 NVIDIA 고정
- MindWorld 씨앗 데이터 공백 (답변에 노출된 기술 이슈)

## 한 줄

**원본이 쌓이고 HajunAI가 이해하며, 그 이해가 다음 대화에 다시 쓰이는 고리가 동작한다.**
