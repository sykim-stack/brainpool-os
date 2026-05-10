# 🧠 BRAINPOOL OS — 샤크 메모리 최종본
> 작성일: 2026-05-09
> 새 Claude 첫 메시지로 이 문서만 붙여넣을 것

---

## 0. 읽는 방법

위에서 아래로. 파일 먼저 달라고 하지 말 것.
이 문서만으로 컨텍스트 잡고 작업 시작.

---

## 1. 프로젝트 정체성

한국어-베트남어 실시간 번역 채팅 플랫폼.
단순 번역기가 아닌 번역 결과를 학습 자산으로 축적하는 언어 생태계.

- 타겟: 50~70대 시니어
- 로그인 없음 (device_id 개인화)
- DB 캐싱 우선 → DeepL fallback
- 번역(24px 크게) → 원문(18px 작게) — 주인공은 번역
- 말풍선: 발신자 기준 (내 메시지=왼쪽, 언어 기준 아님)

---

## 2. 레포 구성 (확정)

```
brainpool-os      ← 엔진 코어 (새 레포, 지금 만드는 것)
brainpool-clean   ← Next.js 앱 (코어링 + 챗)
corenull          ← 별도 레포 (나중에 분리)
```

연결 방향:
```
brainpool-clean
  → import from brainpool-os (npm file: 연결)
```

---

## 3. 계약서 (절대 위반 금지)

```
✅ 모든 함수는 (ctx) => ctx 형태
✅ throw 절대 금지 → _error 필드 반환
✅ req.text() + JSON.parse() (req.json() 금지)
✅ DB 접근은 connectors/storage.js 통해서만
✅ traceId 모든 요청/응답에 포함
✅ HTTP 응답: 200(에러 포함) 또는 500만
✅ Content-Type: application/json; charset=utf-8

❌ 레이어끼리 내부 HTTP 호출
❌ 엔진 안에서 Supabase 직접 createClient
❌ 이벤트 버스 / DI 컨테이너
❌ Hajun에 자동 판단 로직 (지금은 route만)
❌ 거대 엔진 / 거대 Hajun / 거대 Core
```

---

## 4. brainpool-os 구조 (완성)

```
brainpool-os/
├── contracts/
│   ├── ctx.js     ← createCtx / errorCtx / isError
│   └── ctx.md     ← 인간용 계약 문서
│
├── connectors/
│   └── storage.js ← Supabase 단일 접근점
│
├── engines/
│   ├── translation/
│   │   ├── index.js    ← run() 진입점
│   │   ├── translate.js ← DeepL + mock fallback
│   │   └── cache.js    ← DB 캐시 확인/저장
│   │
│   ├── language/
│   │   ├── index.js
│   │   └── detect.js   ← 언어 감지 (범용)
│   │
│   └── emotion/
│       ├── index.js
│       └── analyze.js  ← 감정 분석
│
├── hajun/
│   └── router.js  ← route(engine, ctx) 만
│
├── package.json   ← type:module, exports 맵 포함
└── README.md
```

### TranslationEngine 흐름
```
route('translate', ctx)
  1. detect()     → sourceLang 감지
  2. findCache()  → DB 캐시 확인
  3. translate()  → DeepL (캐시 미스 시)
  4. saveCache()  → 결과 저장
  → ctx 반환
```

### Hajun 현재 역할 (최소)
```javascript
route('translate', ctx)  // TranslationEngine
route('emotion', ctx)    // EmotionEngine
route('detect', ctx)     // LanguageEngine
// 이게 전부. 판단 없음.
```

---

## 5. brainpool-clean 현재 상태

### 문제였던 것 (파악 완료)
1. CoreChatLayer가 내부 HTTP 호출 → `fetch('/api/brainpool')`
2. 번역 로직 3곳 분산 (modules/translate.js, sub/TranslationLayer.js, CoreRingLayer.js)
3. 각 레이어가 Supabase 직접 createClient

### 아직 안 한 것
- brainpool-os 파일 배치 후 brainpool-clean API 교체
- 구 파일들 삭제

### 삭제 대기 파일 (brainpool-clean)
```
brain-engine/layers/CoreChatLayer.js        ← 내부 fetch 있음
brain-engine/layers/CoreRingLayer.js        ← sub 직접 new 함
CoreChatLayer.js (루트)                     ← 중복
brain-engine/layers/sub/LanguageLayer.js    ← detect.js로 통합
brain-engine/layers/sub/MeaningLayer.js     ← analyze.js로 통합
brain-engine/layers/sub/TranslationLayer.js ← translate.js로 통합
brain-engine/layers/sub/CultureLayer.js     ← 고정값만, 삭제
brain-engine/modules/detectLanguage.js      ← language/detect.js로 통합
brain-engine/modules/translate.js          ← translation/translate.js로 통합
brain-engine/modules/emotionFilter.js       ← emotion/analyze.js로 통합
brain-engine/modules/contextFilter.js       ← 고정값만, 삭제
```

### 유지할 파일 (brainpool-clean)
```
brain-engine/layers/sub/chat-room-layer.js     ← 유지 (이미 역할 맞음)
brain-engine/layers/sub/chat-message-layer.js  ← 유지
brain-engine/layers/sub/chat-presence-layer.js ← 유지
brain-engine/layers/sub/chat-db-cache.js       ← 유지 (임시)
```

---

## 6. 전체 작업 순서

### ✅ 완료
- brainpool-os 구조 설계 확정
- PowerShell 스크립트 작성 완료 (create_brainpool_os.ps1)

### 🔴 지금 해야 할 것
1. PowerShell 스크립트 실행 → `C:\brainpool-os` 생성
2. `cd C:\brainpool-os && npm install`
3. GitHub에 brainpool-os 레포 생성 후 push

### 🟠 그 다음
4. brainpool-clean에서 연결
   ```
   cd brainpool-clean
   npm install file:C:\brainpool-os
   ```
5. `app/api/brainpool/route.ts` 교체
   ```typescript
   import { route }     from 'brainpool-os/hajun';
   import { createCtx } from 'brainpool-os/contracts';
   ```
6. `app/api/chat/send/route.ts` 교체
7. 구 파일들 삭제
8. `next build` 확인

### 🟡 이번 주 내
9. engines/chat/ 분리 (brainpool-os에 추가)
   - chat-room-layer → engines/chat/room.js
   - chat-message-layer → engines/chat/message.js

### 나중에
10. CoreNull 별도 레포 분리

---

## 7. DB 테이블

| 테이블 | 용도 |
|--------|------|
| `chat_rooms` | 채팅방 (id=UUID, invite_code=6자) |
| `chat_messages` | 메시지 |
| `chat_participants` | 참여자 |
| `tb_trans_logs` | 번역 캐시 (direction 컬럼: 'ko→vi' or 'vi→ko') |
| `tp_translations` | 방언 사전 |
| `tp_conflicts` | 문화 충돌 단어 |

---

## 8. 환경변수

```env
# brainpool-os (엔진)
SUPABASE_URL=https://grlfocvlfatuvphkyivd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DEEPL_API_KEY=b7d91801-1316-448a-9896-dea29a271183:fx

# brainpool-clean (Next.js) — 기존 이름 유지
NEXT_PUBLIC_SUPABASE_URL=https://grlfocvlfatuvphkyivd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
DEEPL_API_KEY=...
```

---

## 9. 핵심 판단

이 프로젝트는 "AI 앱"이 아니라 "운영 판단 OS"를 향해 가고 있음.

지금 단계:
- Core = 입출력만 (분석 없음)
- 엔진 = 기능 하나씩 (작게)
- Hajun = route만 (판단 없음)

절대 금지:
- 거대 Core / 거대 엔진 / 거대 Hajun
- 기능 추가는 새 엔진 추가로 (기존 엔진 비대화 금지)