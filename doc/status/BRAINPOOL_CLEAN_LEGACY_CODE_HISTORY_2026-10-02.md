# brainpool-clean 레거시 코드 상태 · 역사 기록

**기준일:** 2026-10-02  
**성격:** 설계 확정서가 아닌 **진화 과정 역사 기록**  
**원칙:** 에러도 메시지로 취급한다. 죽은 코드도 삭제하지 않고 역사로 남긴다.

---

## 핵심 결론: 3가지 코드베이스가 공존

brainpool-clean은 **2026년 9월 경 Next.js App Router로 마이그레이션을 완료**했으나, **구버전 코드가 정리되지 않은 상태**이다.

| 코드                           | 유형               | 상태          | 비고                    |
| ---------------------------- | ---------------- | ----------- | --------------------- |
| `engine.js` (730L)           | 브라우저 사이드 엔진      | **레거시 (정적 경로에서 참조)** | `index.html`에서 `<script src="engine.js">` 로드 |
| `/api/corechat.js` (398L)    | Pages Router API | **죽은 코드**   | Next.js 루트 api/ 미인식   |
| `/api/corering.js` (398L)    | Pages Router API | **죽은 코드**   | 동일                    |
| `/api/locale.js`             | Pages Router API | **죽은 코드**   | 동일                    |
| `background.js` + `modules/` | HealthMonitor    | **죽은 코드**   | modules/ 디렉토리 존재하나 본선 미사용 |
| `app/api/*.ts`               | App Router API   | **활성**      | brain-engine import   |
| `brain-engine/*`             | 모듈화 엔진           | **활성**      | app/api에서 import 사용   |
| `app/page.tsx`               | React UI         | **활성**      | Next.js 13 App Router |

> **중요 뉘앙스**  
> App Router + brain-engine 경로에서는 구버전 파일이 import되지 않는다.  
> 그러나 `index.html`(정적 진입점)은 여전히 `engine.js`를 직접 로드한다.  
> 따라서 “완전 죽은 코드”가 아니라 **본선에서는 죽은 코드 + 정적 경로에서는 아직 살아있는 코드**로 기록한다.

---

## 아키텍처 진화 과정 (역사)

### Phase 1: API 중심 초기 구조 (잔유물)

```
브라우저 ←script→ engine.js ←fetch→ /api/*.js (Pages Router)
```

- engine.js: 브라우저에서 직접 DOM 조작 (번역, 채팅, localStorage)
- /api/corechat.js, corering.js: API 엔드포인트 (Next.js Pages Router 방식)
- **목적**: brainpool OS 엔진을 모든 프로젝트에 API 형태로 배포

### Phase 2: 모듈화 진화 (현재 활성 본선)

```
브라우저 (React) ←fetch→ /app/api/*.ts ←import→ brain-engine/*
```

- `app/page.tsx`: React 컴포넌트 기반 UI (React 상태 관리, hooks)
- `app/api/*.ts`: Next.js 13+ App Router 방식
- `brain-engine/`: ESM 모듈로 분리된 번역/감정/방언/채팅/CoreHub 엔진

### Phase 3: 자급자족 (진행 중)

brainpool-clean은 **CoreHub/CoreNull 없이도 완전한 번역/채팅/단어장 시스템**을 가진다:

- 번역: brain-engine/engines/translation (DeepL + DB cache + Gemini)
- 감정 분석: brain-engine/engines/emotion (Gemini + keyword fallback)
- 방언 감지: brain-engine/engines/dialect (사전 + Gemini 보완)
- 채팅: brain-engine/engines/chat (message, room)
- 어휘/단어장: brain-engine/layers/RingLexiconLayer
- CoreHub 연결: `/app/api/corehub/route.ts` (house/score **조회만** 가능)

---

## 확인된 증거 (2026-10-02 기준)

1. **grep/검색 결과**: `/app/` 디렉토리 내 engine.js, corechat.js, corering.js, locale.js를 어디서도 참조하지 않음
2. **git 히스토리**: engine.js는 brainpool-clean 초기 커밋부터 존재하나 최근 커밋에서 수정이 거의 없음
3. **Next.js 설정**: `next.config.ts` — App Router 전용 설정 (Pages 디렉토리 없음)
4. **API 라우팅**: Next.js 13+에서 루트 `api/` 디렉토리는 인식하지 않음 (`app/api/`만 인식)
5. **정적 진입점**: `index.html`이 `engine.js`와 `public/js/core/*`를 여전히 로드함

---

## brainpool-clean vs brainpool-corehub / corenull

| 항목       | brainpool-clean                   | brainpool-corehub             | brainpool-corenull            |
| -------- | --------------------------------- | ----------------------------- | ----------------------------- |
| **역할**   | 번역/채팅/단어장 **Experience producer** | 패턴 인식 **Meaning extractor**   | 집/방 **Space provider**        |
| **입/출력** | 브라우저 UI → tb_trans_logs, messages | CoreHub API (Fact 수집/분석)      | CoreNull API (houses, spaces) |
| **결합도**  | 자체 완비 (CoreHub/CoreNull 없이도 동작)   | brainpool-clean에 의존 (Fact 소비) | brainpool-clean에 의존 (Fact 소비) |

**brainpool-clean은 "결과를 모르는 프로젝트"의 완성 형태**이다.  
번역 채팅으로부터 3가지 Fact을 생산(tb_trans_logs, messages, corenull_houses)하지만, CoreHub의 패턴 인식 결과는 사용자에게 보여지지 않는다.

---

## 역사 기록 원칙 (이 문서의 존재 이유)

- 레거시 코드를 **삭제하지 않는다**.
- 진화 과정에서 생긴 흔적(죽은 API, 구버전 엔진, 정적 진입점)은 **메시지로 취급**한다.
- 나중에 “왜 이렇게 되었는가”를 물을 때, 이 문서와 실제 파일이 함께 답을 줄 수 있도록 보존한다.
- 정리가 필요할 때는 이 기록을 근거로 “무엇을 왜 남겼는지 / 무엇을 왜 옮겼는지”를 설명할 수 있어야 한다.

```
에러도 메시지로 취급한다.
죽은 코드도 역사로 남긴다.
삭제보다 기록을 우선한다.
```

---

## 관련 문서

- `status/BRAINPOOL_INTEGRATED_STRUCTURE_INVESTIGATION_v2_2026-09-28.md` — 전체 구조·조사 기준 기록
- brainpool-clean repo 내 `CORERING_STATUS.md` (2026-06-10) — 기능 완료 현황
- brainpool-clean repo 내 `index.html`, `engine.js`, `api/` — 실제 레거시 흔적

---

*이 문서는 2026-10-02 시점의 관찰을 고정한 역사 기록이다.  
새로운 증거가 나오면 기존 내용을 덮어쓰지 않고, 기존 확인 + 새로운 증거 + 변경된 상태 형태로 갱신한다.*
