# HajunAI ↔ CoreNull 인증 연결 — 다음 작업자 인수인계서

**대상:** 클로2(HajunAI), 클로3(CoreNull), 클로4(CoreHub), Mes(조사)  
**작성:** Mes (Hermes)  
**기준:** 2026-11-22 01:47 KST 분석 문서(`01-analysis.md`) 기반  
**원칙:** 읽기 전용 조사 → 사람 승인 → 쓰기 / 구조 변경 금지 / 추측 금지

---

## 🎯 이 인수인계서의 목적

> **HajunAI CoreNull 버튼이 401로 실패하는 근본 원인(CoreHub 세션 부재)을 해소하고, Identity 매핑·집 데이터 불일치를 정리하여 정상적인 handoff 플로우를 복구한다.**

---

## 📋 현재 상태 한눈에 보기

| 구성요소 | 상태 | 블로커 |
|---|---|---|
| **HajunAI CoreNull 버튼** | 배포됨 (`b5c8220`) | **세션 없어 401 → handoff 티켓 미발급** |
| **CoreNull handoff 처리기** | 배포됨 (`2888653`) | 연결 없으면 `owner_link_required` 거부 |
| **Identity 매핑** | **불일치** (Google 계정별 다른 Owner) | DB vs 브라우저 화면 불일치 |
| **집 데이터** | 미확인 (SNL 집 삭제 여부 등) | `corenull_houses` 조회 필요 |
| **CoreHub** | 배포됨 (`932cd90`) | Handoff 코드 준비됨, 단 호출 안 됨 |

---

## 🔴 최우선 해결 과제 (블로커 1순위)

### **HajunAI에서 CoreHub 유효 세션/토큰을 얻는 경로가 작동하지 않음**

**증상:** `/api/auth/handoffs` 호출 시 `Authorization: Bearer` 헤더도 `corehub_session` 쿠키도 없음 → 즉시 401

**확인해야 할 것:**
1. Hajun 로그인 흐름(`/api/auth/*`, `lib/auth*.ts`, `lib/supabase.ts`)에서 **CoreHub 토큰 발급·저장 로직**이 존재하는가?
2. 기존 Google 로그인/세션 생성 시 **CoreHub와 통신하여 토큰을 받아오는가?**
3. 토큰을 **쿠키(`corehub_session`)** 또는 **헤더용 저장소**에 저장하는가?
4. **만료/갱신 로직**은 있는가?

**예상 원인 후보:**
- CoreHub 연동 코드가 배포되지 않았거나(로컬만), 배포본에서 빠짐
- 토큰 저장소가 클라이언트 측(localStorage/쿠키)인데 서버 사이드에서 못 읽음
- 토큰 만료 후 갱신 안 됨

---

## 🟡 2순위: Identity 매핑·집 데이터 정리

### 실행 순서 (승인 후)

```bash
# 1) Identity 매핑 재조회 (동일 시점)
# 2) 두 Owner의 집 행 조회
# 3) 결과 대조 → 불일치 원인 식별
```

**예상 시나리오별 대응:**

| 시나리오 | 대응 |
|---|---|
| **A. DB 매핑이 맞음** (두 Google 계정 → 다른 Owner) | 사용자 주장("둘 다 47c7… 본다")이 브라우저 `localStorage` 잔재 탓 → 별도 프로필 테스트로 확인 |
| **B. 브라우저 화면이 맞음** (둘 다 같은 Owner) | Identity 매핑이 꼬임 → **사람 승인 후** 매핑 정리 (Owner 병합 또는 매핑 수정) |
| **C. SNL 집 삭제됨** | 집 행 조회로 확정 → 사용자 보고와 대조 |
| **D. `/me/house` 화면이 최신 1채만 표시** | 집 2채 있음에도 1채만 보이는 것 → 화면 로직 확인 후 UX 개선 여부 결정 |

---

## 🟢 3순위: CoreHub 토큰 플로우 문서화·테스트

**필요 산출물:**
- Hajun → CoreHub 토큰 발급/저장/전달 전체 시퀀스 다이어그램
- 토큰 만료·갱신 정책
- handoff 티켓 발급 선행 조건 체크리스트

---

## 📂 관련 파일 위치 (코드 조사 시작점)

### HajunAI (`hajuncore-app`)
```
app/api/auth/handoffs/route.ts      # handoff 요청 진입점 (401 발생 지점)
app/api/auth/*/route.ts             # 로그인/세션 관련 전체
lib/auth*.ts                        # 인증 헬퍼
lib/supabase.ts                     # Supabase 클라이언트 (서버/브라우저)
lib/corehub*.ts                     # CoreHub 통신 관련 (있다면)
```

### CoreNull (`brainpool-corenull`)
```
app/auth/handoff/route.ts           # handoff 교환 처리
app/auth/google/route.ts            # Google 로그인 (localStorage 키 전달)
app/api/corenull/houses/route.ts    # 집 조회 API
lib/identity.ts                     # Identity 매핑 로직
components/me/house/*               # `/me/house` 화면 (최신 1채만 표시 의심)
```

### CoreHub (`brainpool-corehub`)
```
api/handoffs/route.ts               # 티켓 발급
api/handoffs/exchange/route.ts      # 티켓 교환
lib/handoff.ts                      # 핵심 로직
```

---

## ⚠️ 절대 하지 말 것 (경계 잠금 준수)

| 금지 사항 | 이유 |
|---|---|
| **DB 직접 수정** (Identity 매핑 변경, Owner 병합, 집 삭제/생성) | 사람 승인 필요, 쓰기=승인 후만 |
| **재배포** (핫픽스 커밋 푸시) | 세션 전제 미충족 상태에서 배포해도 동일 실패 |
| **브라우저 `localStorage`/`cookie` 삭제** | 영향 확인 전 삭제하면 원인 추적 불가 |
| **CoreRing 연계 작업** | CoreNull handoff 정상화 전까지 보류 (원칙) |
| **추측을 사실로 기록** | 미확인은 "미확인"으로 표기 |

---

## ✅ 권장 다음 스텥 (즉시 착수 가능)

| 순서 | 작업 | 담당 | 산출물 |
|---|---|---|---|
| 1 | **Hajun 인증 코드 전수 조사** — CoreHub 토큰 획득 경로 찾기 | 클로2 + Mes | 경로 존재 여부·코드 위치 리포트 |
| 2 | **읽기 전용 SQL 실행** (승인 후) — Identity·집 행 대조 | Mes | 대조표 + 불일치 원인 가설 |
| 3 | **`/me/house` 화면 로직 확인** — 최신 1채만 표시하는지 | 클로3 | 화면 코드 분석 결과 |
| 4 | **별도 브라우저 프로필 테스트** — 계정별 로그인 결과 비교 | 사용자 | 테스트 결과 (새 Owner/집 생성 안 됨 확인) |
| 5 | **CoreHub 토큰 플로우 문서화** — 선행 조건 정리 | 클로4 | 시퀀스 다이어그램 + 체크리스트 |

---

## 📌 인수인계 체크리스트 (다음 작업자 확인용)

- [ ] `01-analysis.md` 전체 읽음
- [ ] Hajun `/api/auth/handoffs` 401 발생 코드 라인 확인
- [ ] Hajun 로그인/세션 코드에서 CoreHub 토큰 관련 로직 탐색
- [ ] CoreNull handoff 교환 코드(`owner_link_required` 분기) 확인
- [ ] Identity 매핑·집 조회 SQL 이해
- [ ] 금지 사항(위 표) 숙지
- [ ] 질문 사항 있으면 Mes/사용자에게 **작업 전** 확인

---

## 🔗 참조 링크

| 항목 | 링크 |
|---|---|
| 분석 문서 | `./01-analysis.md` |
| HajunAI Production | https://hajuncore-app.vercel.app/ |
| CoreNull Production | https://corenull.vercel.app/ |
| HajunAI 커밋 `b5c8220` | https://github.com/sykim-stack/hajuncore-app/commit/b5c82201e5dd4030751bf00bcd4b21a3b6ee2c7e |
| CoreNull 커밋 `2888653` | https://github.com/sykim-stack/brainpool-corenull/commit/2888653a5c2db1c673a18e3e06ffd992cef2d5c8 |
| CoreHub 현재 커밋 | https://github.com/sykim-stack/brainpool-corehub/commit/932cd90d3a72935992b2fe32046512fdbf8bb768 |

---

## 💬 Mes로부터 한 마디

> **이 이슈의 핵심은 "Hajun에 CoreHub 세션이 없다"는 한 줄로 요약됨.**
> 
> 화려한 handoff 플로우·Identity 매핑·집 데이터 모두 **세션이 있어야 시작 가능**.
> 
> **클로2(HajunAI) 최우선: 로그인→세션→CoreHub 토큰 경로 찾아서 왜 없는지 규명.**
> 
> 나머지(Identity·집)는 세션 생기면 자연스럽게 풀리거나, 읽기 전용 조회로 바로 원인 나옴.
> 
> **추측하지 말고 코드·로그·DB로만 말하기.**  
> **승인 없는 쓰기 절대 금지.**

---

**작성:** Mes (Hermes)  
**전달:** GitHub `brainpool-handoff/2026-11-22-hajun-corenull-auth-issue/` 폴더에 커밋  
**다음:** 클로2/클로3/클로4 이 문서 읽고 1번 작업부터 착수