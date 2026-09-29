# BRAINPOOL 통합 구조·조사 기록 v2

**경험에서 생태계로**

기준일: 2026-09-28  
목적: BRAINPOOL 전체 구조와 현재까지의 코드·DB·Git 조사 결과를 하나의 기준 문서로 고정한다.  
성격: 설계 확정서가 아닌 통합 조사·기준 기록

---

## 1. BRAINPOOL의 출발점

BRAINPOOL은 개인을 식별하고 추적하는 시스템을 만들기 위한 프로젝트가 아니다.

핵심은 개인의 이름이나 계정을 기억하는 것이 아니라,  
**사람들이 남긴 경험의 패턴을 기억하고 연결하는 것**이다.

따라서 시스템의 관심 대상은 사람이 아니라 경험과 경험 사이의 관계다.

```
개인
 ↓
경험 / 메시지
 ↓
비슷한 경험 발견
 ↓
관계 형성
 ↓
패턴 발견
 ↓
새로운 의미
 ↓
새로운 경험
```

목표는 특정 개인을 프로파일링하는 것이 아니라,  
비슷한 경험을 가진 사람들의 그룹을 모으고 세분화하여 새로운 연결을 발견하는 것이다.

---

## 2. 식별하지 않는 시스템

BRAINPOOL의 중요한 원칙:

> 우리는 사람을 식별하지 않는다.  
> 그러나 프로젝트·공간·맥락은 식별할 수 있어야 한다.

여기서 구분해야 한다.

**개인 식별**  
개인의 이름, 계정, 지속적인 개인 추적 등을 목적으로 하지 않는다.

**구조적 식별**  
시스템 내부의 관계를 유지하기 위해 다음과 같은 구조적 ID는 사용할 수 있다.

- message.id
- room.id
- house.id
- project/context key
- owner/context key

그러나 이러한 값이 개인을 추적하기 위한 개인 식별자로 사용되어서는 안 된다.

즉,

```
ID가 존재한다
≠
사람을 식별한다
```

라는 구분이 필요하다.

---

## 3. Message 중심 구조

BRAINPOOL의 기본 데이터 단위는 Message다.

기본 구조는 하나의 Message 구조를 중심으로 유지한다.

```
Message
├── id
├── type
├── content
├── meta
├── relations
└── created_at
```

type은 예를 들어 다음과 같이 사용된다.

```
post
comment
chat
event
fruit
```

중요한 원칙:

> 메시지는 변하지 않는다.  
> 쓰이는 곳에서 의미를 재탄생시킨다.

따라서 각 Core가 같은 메시지를 서로 다른 목적으로 해석할 수 있다.

```
                    Message
                       │
        ┌──────────────┼──────────────┐
        ↓              ↓              ↓
     CoreNull       CoreRing        CoreHub
       View       Interpretation   Connection
        │              │              │
        └──────────────┼──────────────┘
                       ↓
                    HajunAI
                     Mind
```

---

## 4. BRAINPOOL Core 역할

현재 구조에서 각 Core의 역할은 다음과 같이 구분한다.

| Core     | 역할                                           |
| -------- | -------------------------------------------- |
| CoreNull | View / House / Seed / Experience             |
| CoreChat | Flow / Message 전달                            |
| CoreRing | Interpretation / Translation / Meaning       |
| CoreHub  | Pattern / Connection / Meaning / Opportunity |
| HajunAI  | Mind / Context / 종합                          |

역할을 서로 섞어 하나의 거대한 시스템으로 만들지 않는다.

---

## 5. CoreNull — 경험의 시작

CoreNull은 사람이 경험을 남기는 공간이다.

기본 경험 흐름은 다음과 같다.

```
글 작성
 ↓
재방문
 ↓
비슷한 글 발견
 ↓
이웃
 ↓
참여
 ↓
씨앗
 ↓
열매
 ↓
새 경험
 ↺
```

일반적인 웹 검색 구조와 다르다.

일반 웹:

```
글 작성
 ↓
검색
 ↓
글 발견
 ↓
다시 검색
```

CoreNull:

```
경험
 ↓
재방문
 ↓
비슷한 경험
 ↓
관계
 ↓
참여
 ↓
새로운 경험
```

따라서 CoreNull은 단순 게시판이 아니라 경험이 순환하는 공간을 목표로 한다.

---

## 6. 광장과 창고

현재 개념상 공간은 크게 두 가지 방향으로 이해할 수 있다.

**광장**  
비슷한 경험이 모이는 공간.

```
경험 A ─┐
경험 B ─┼→ 공통점 발견
경험 C ─┘
```

유사한 경험을 가진 사람들이 모이고 공통 패턴이 나타날 수 있다.

**창고**  
서로 다른 경험이 만나는 공간.

```
경험 A ─────┐
            ├→ 예상하지 못한 연결
경험 B ─────┘
```

Random Warehouse 역시 단순한 무작위 노출보다 새로운 경험 발견과 연결 가능성이라는 관점에서 이해할 필요가 있다.

단, 이 부분은 현재 구현과 완전히 동일하다고 단정하지 않고 별도 검증 대상으로 둔다.

---

## 7. CoreRing — 의미의 해석

CoreRing은 메시지의 언어적 의미를 해석한다.

핵심은 단어를 무조건 잘게 쪼개는 것이 아니다.  
의미를 전달하는 표현 단위와 관계·맥락을 발견한다.

예:

```
오늘 날씨
+
정말 좋다
+
너와
+
산책하다
```

처럼 의미를 전달하는 표현 단위를 다룬다.

단일 단어만 무한히 DB에 추가하는 구조를 피하고, 재사용 가능한 표현 지식을 축적한다.

---

## 8. CoreRing 번역 학습 경로

현재 조사에서 기준 경로는 Path A다.

```
/api/brainpool
      ↓
translator
      ↓
/api/chat
      ↓
brain-engine
      ↓
emotion/analyze.js
      ↓
Gemini keywords
      ↓
saveVocabulary / savePhrase
      ↓
tp_lexicon / tp_phrases
```

tb_trans_logs는 번역 기록의 핵심 저장소다.

Path B:

```
/api/translate
 ↓
GeminiAnalysisProvider
 ↓
tb_trans_logs
```

현재 조사 기준으로 Path B는 학습 루프의 본선이 아니라 참조/보류 경로다.

---

## 9. tp_phrases

tp_phrases는 표현 단위 지식을 축적한다.

주요 구조:

```
phrase_hash
source_lang
source_text
target_lang
target_text
context_type
source
source_message_id
tb_trans_log_id
frequency
```

phrase_hash는 sourceLang + normalized + targetLang을 기준으로 unique 처리한다.

현재 조사 당시 약 97개 표현이 존재했으며, 상당수가 translator source였다.

---

## 10. tb_trans_log_id 연결

현재 CoreRing에서 중요한 연결은 다음이다.

```
chat/send
 ↓
tb_trans_logs INSERT
 ↓
translationMeta.tbTransLogId
 ↓
savePhrase(logId)
 ↓
tp_phrases.tb_trans_log_id
```

또한 chat Message의 relations에도 번역 로그 ID가 연결된다.

따라서 번역 기록 → 표현 지식 → 메시지의 관계를 유지할 수 있다.

현재 후속 작업으로 다음이 존재한다.

- A1: 표현 정규화 (Xin chào? / Xin chào)
- A2: Context UI
- A3: tp_phrases context 분포 및 broken log link 조사

---

## 11. CoreHub — 관계와 패턴

CoreHub의 개념적 흐름:

```
Pattern
   ↓
Connection
   ↓
Meaning
   ↓
Opportunity
```

현재 실제 코드에는 다음 Engine이 존재한다.

```
FactCollector
ConnectionEngine
MeaningEngine
OpportunityEngine
```

주요 테이블:

```
corehub.facts
corehub.connections
corehub.meanings
corehub.opportunities
corehub.learning_logs
```

---

## 12. CoreNull → CoreHub 연결

CoreNull에서 Seed Room을 생성할 때 CoreHub로 Fact를 전달하는 코드가 존재한다.

개념적으로:

```
CoreNull
  ↓
Seed Room created
  ↓
pushFact()
  ↓
CoreHub /api/corehub/facts
```

전달 정보에는 예를 들어 다음이 포함된다.

```
source: CoreNull
fact_type: space.seed.created
owner_key
house_id
payload:
  room_id
  bloom_date
  visibility
  status
  ...
```

현재 CoreHub endpoint:

```
https://brainpool-corehub.vercel.app/api/corehub/facts
```

CoreNull에서 사용하는 URL과 현재 배포 URL이 일치하는 것으로 조사되었다.

---

## 13. CoreHub 현재 Pipeline

현재 코드 기준 pipeline은 개념적으로 다음과 같다.

```
Fact 수신
 ↓
같은 owner_key의 최근 Fact 조회
 ↓
Pattern 검사
 ↓
Connection 생성
 ↓
Meaning 생성
 ↓
Opportunity 생성
 ↓
Fact processed 처리
```

현재 확인된 주요 Pattern:

```
1. seed.to.fruit.achieved
   seed.created + fruit.created

2. cross.language.relationship
   translated + chat.sent

3. seed.abandonment.risk
   seed.created + !room.visited + !fruit.created
```

다만 seed.abandonment.risk는 현재 배포 코드에서는 비활성화된 것으로 확인되었다.

따라서 현재 실제 활성 Pattern은 우선 다음 두 가지로 보는 것이 안전하다.

```
seed.to.fruit.achieved
cross.language.relationship
```

---

## 14. CoreHub DB 조사 결과

현재 DB에 존재하는 CoreHub 데이터는 현재 운영 데이터라고 단정하면 안 된다.

조사 결과:

- corehub.facts에는 created_at이 없고 occurred_at을 사용한다.
- 2026-07-11~18에 집중된 Fact들이 존재한다.
- 16개 Fact가 조사 당시 모두 processed=false였다.
- 일부 Fact에는 test, test-owner-001, test-expires-001 등 테스트성 값이 존재했다.
- 16개 중 9개가 테스트성 데이터로 분류되었다.
- 일부 Opportunity에는 source_meaning_id = null이 존재했다.
- learning_logs에는 당시 데이터가 없었다.
- Opportunity들은 소비되지 않은 상태였다.

따라서 현재 DB의 기존 CoreHub 데이터는:

CoreHub 자체가 테스트용이었다는 의미가 아니라, 현재 DB에 남아 있는 데이터가 초기 개발/API 검증 과정의 잔여 데이터일 가능성이 높다.

이 구분이 중요하다.

---

## 15. tester-me-001 사건

tester-me-001 Fact가 2026-09-22에 별도로 존재한다.

현재 조사에서 이 Fact가 processed=false로 남아 있는 현상이 발견되었다.

그러나 DB만으로는 다음 중 어느 것인지 확정할 수 없다.

```
A. 현재 배포 코드와 Git 코드가 다름
B. CoreNull → CoreHub POST 자체가 실패함
C. Fact는 직접 DB에 들어갔음
D. Pipeline이 실행됐으나 내부에서 오류 발생
```

또한 CoreHub endpoint의 GET/live probe가 HTTP 200을 반환한 것은 확인되었지만,

GET 200 ≠ POST pipeline 정상 작동

이다.

따라서 이 사건의 최종 확인에는 Vercel runtime log 또는 실제 POST replay가 필요하다.

---

## 16. pushFact의 주의점

현재 CoreNull → CoreHub 연결에는 fire-and-forget 방식이 존재한다.

개념적으로:

```
pushFact(...)
  .catch(() => null)
```

와 같은 구조가 있기 때문에 CoreHub 전달 실패가 CoreNull 사용자 흐름에 직접 노출되지 않을 수 있다.

따라서:

```
CoreNull 성공
≠
CoreHub 전달 성공
```

이다.

이것은 현재 통합 조사에서 중요한 관찰점이다.

---

## 17. House 구조 조사

현재 DB에는 서로 다른 House 계층이 존재한다.

확인된 테이블:

```
public.corenull_houses
corenull.houses
```

두 테이블은 동일하지 않다.

**public.corenull_houses**  
주요 필드:

```
id
slug
owner_key
primary_language
title
description
...
```

**corenull.houses**  
주요 필드:

```
id
owner_id
village_id
house_type
name
description
core_user_id
owner_key
space_id
...
```

또한 corenull.houses는 현재 PostgREST exposed schema 설정 때문에 직접 REST 접근이 제한된 상태였다.

현재 조사상 새로운 CoreNull 흐름은 public.corenull_houses를 사용하고, 과거/병렬 코드에는 corenull.houses 사용 흔적이 존재한다.

이는 구조 전환 또는 레거시 호환 계층이 존재할 가능성을 보여주지만, 최종 의도는 별도 검증이 필요하다.

---

## 18. House API와 owner_key

CoreNull House API 조사 결과 House 생성 시 호출자가 전달한 owner_key를 corenull_houses에 저장한다.

즉:

```
caller
 ↓
owner_key
 ↓
corenull_houses.owner_key
```

House API 자체가 개인 계정을 생성하는 구조라고 볼 근거는 없다.

Identity API에서도 owner_key는 기존 ownership/context key를 전달하고 복구하는 역할을 한다.

따라서 현재 조사 기준:

owner_key는 개인 계정 ID라기보다 House / Context / Ownership 관계를 연결하기 위한 키로 보는 것이 더 일관된다.

단, 역사적 코드와 현재 코드 사이에는 구조 변화가 있으므로 모든 시점에서 동일한 의미였다고 단정하지 않는다.

---

## 19. owner_key / device_id 역사

역사적 코드에는 다음과 같은 호환 로직이 확인되었다.

```
corenull_owner_key가 없고
corenull_device_id만 있으면

device_id
   ↓
owner_key
```

또한 과거 구조에서는:

```
owner_key === device_id
```

였던 흔적이 존재한다.

현재 구조는 Owner와 Device를 분리하는 방향으로 이동했다.

따라서 과거 데이터에서 동일한 값이 여러 영역에 나타나는 현상을 이해할 때,

```
device
≈
anonymous context
≈
owner/context key
```

였던 역사적 구조를 고려해야 한다.

---

## 20. b824... 조사 결과

특정 값 b824c6ed-e935-40e3-9a99-06904ac2e773를 추적한 결과:

```
tb_trans_logs.user_id
        │
        ├── 2026-09-06 번역 로그 2개
        │
        └── b824...

public.corenull_houses.owner_key
        │
        └── 동일한 b824...
```

반면 현재 조사된 messages.user_id에서는 동일 값이 발견되지 않았다.

따라서 현재 가장 근거가 높은 해석은:

b824...는 개인 계정 식별자라기보다, 당시 owner_key ≈ device_id 구조에서 House와 번역 저장 경로를 연결하던 익명 Context / Device / Owner 계열 키였을 가능성이 높다.

다만 2026-09-06의 실제 runtime request를 직접 재현하거나 로그로 확인한 것은 아니므로,  
정확히 어떤 요청 변수에서 tb_trans_logs.user_id로 들어갔는지는 미확인이다.

DB 수정은 이 조사 과정에서 수행하지 않았다.

---

## 21. Message와 Room Namespace

현재 messages.room_id는 Message type에 따라 서로 다른 Room namespace를 사용한다.

조사 결과:

```
post/comment
    ↓
public.corenull_rooms.id

chat
    ↓
public.chat_rooms.id
```

또한:

```
post/comment
  device_id = null
  owner_key  = populated

chat
  device_id = populated
  owner_key  = null
```

이라는 패턴이 관찰되었다.

이는 하나의 Message 구조를 유지하면서 각 Core/Message type이 서로 다른 공간 namespace를 사용하는 현재 구조와 일관된다.

---

## 22. CoreRing과 CoreHub의 관계

CoreRing은 메시지의 언어적 의미를 해석한다.  
CoreHub는 여러 경험과 Fact 사이의 관계를 찾는다.

따라서 역할은 다음처럼 구분하는 것이 자연스럽다.

```
Message
   ↓
CoreRing
언어 / 번역 / 표현 / 감정 / 의미
   ↓
CoreHub
Fact / Pattern / Connection / Meaning / Opportunity
```

CoreRing이 메시지를 해석하고,  
CoreHub가 여러 메시지와 경험 사이의 관계를 발견한다.

둘을 하나의 엔진으로 합치지 않는다.

---

## 23. HajunAI의 위치

HajunAI는 전체 맥락을 종합하는 역할을 가진다.

```
CoreNull
  경험
    ↓
CoreRing
  의미
    ↓
CoreHub
  관계 / 패턴
    ↓
HajunAI
  맥락 종합
```

현재 HajunAI 쪽에서는 방/대화 Context를 종합하는 방향의 작업이 진행되고 있다.

핵심은 원본 Message를 변경하는 것이 아니라,  
여러 Core에서 생성된 해석과 관계를 Context 수준에서 연결하는 것이다.

---

## 24. 전체 BRAINPOOL 생태계

현재까지의 구조를 하나로 연결하면 다음과 같다.

```
                         BRAINPOOL
                             │
                    ┌────────┴────────┐
                    │                 │
                 경험 생성          경험 발견
                    │                 │
                 CoreNull          CoreNull
                    │                 │
                    └───────┬─────────┘
                            ↓
                         Message
                            │
             ┌──────────────┼──────────────┐
             ↓              ↓              ↓
         CoreRing        CoreHub        CoreChat
          의미해석       관계/패턴        Flow
             │              │              │
             └──────────────┼──────────────┘
                            ↓
                         HajunAI
                         Context
                            │
                            ↓
                       새로운 경험
                            │
                            └────────→ 다시 BRAINPOOL
```

즉 BRAINPOOL은 단순한 앱들의 모음이 아니라,  
경험 → 관계 → 의미 → 새로운 경험 이 순환하는 생태계를 목표로 한다.

---

## 25. MES 개념

BRAINPOOL 프로젝트에서 AI 작업 자체도 하나의 시스템으로 관리할 필요가 생겼다.

AI가 모두 같은 일을 반복하게 하는 것이 아니라 역할별로 나눈다.

```
                    사람
                     ↓
                    MES
             ┌───────┼───────┐
             ↓       ↓       ↓
           탐색     분석     검증
            AI       AI       AI
             └───────┼───────┘
                     ↓
                  결과 수집
                     ↓
                  교차 검증
                     ↓
                   사람 검수
                     ↓
                    검증
                     ↓
                   배포
```

MES의 핵심은 AI를 하나의 거대한 지능처럼 사용하는 것이 아니라,  
AI 노동력을 역할별로 분류·배치·검수하는 것이다.

---

## 26. AI 역할 분리 원칙

여러 AI가 같은 코드를 반복해서 분석하는 대신 역할을 분리한다.

예:

```
AI A
탐색

AI B
구조 분석

AI C
DB 검증

AI D
코드 검증

AI E
반례 / 오류 탐색

AI F
최종 교차검증
```

그리고 결과는 사람이 확인한다.

중요한 원칙:

> AI의 결과는 바로 사실이 아니다.  
> 빠른 탐색 결과와 검증된 사실을 구분한다.

---

## 27. 현재 프로젝트의 조사 원칙

앞으로 모든 통합 작업에서 다음 원칙을 유지한다.

1. 실제 흐름 먼저 확인

```
문서
 ↓
코드
 ↓
DB
 ↓
실행 결과
```

가능하면 실제 runtime까지 확인한다.

2. 구조를 먼저 바꾸지 않는다  
현재 구조가 실제로 작동하는지 확인하기 전에 리팩터링하지 않는다.

3. 기존 구조를 최대한 재사용한다  
이미 만들어진 기능을 다시 만들지 않는다.

4. 연결과 재설계를 구분한다

```
연결
≠
재설계
```

현재 목표가 연결이라면 연결만 한다.

5. DB를 조사 과정에서 임의로 수정하지 않는다  
특히 forensic investigation에서는:

```
조회
→ 비교
→ 기록
→ 검증
```

순서를 유지한다.

6. 확정과 가설을 구분한다  
모든 조사 결과는 다음 중 하나로 표시한다.

```
[확정]
[강한 근거]
[가설]
[미확인]
```

---

## 28. 현재까지의 핵심 확정 사항

**[확정]**

- CoreHub 실제 코드가 존재한다.
- CoreHub 실제 배포 endpoint가 존재한다.
- CoreHub는 Fact → Pattern → Connection/Meaning/Opportunity 흐름을 가진다.
- CoreNull에서 CoreHub로 Fact를 전달하는 코드가 존재한다.
- CoreRing의 번역 기록은 tb_trans_logs를 중심으로 한다.
- tp_phrases가 표현 지식을 저장한다.
- Message는 통합 구조를 중심으로 사용된다.
- post/comment와 chat은 서로 다른 Room namespace를 사용할 수 있다.
- public.corenull_houses와 corenull.houses는 실제로 서로 다른 테이블이다.
- 역사적 코드에 device_id → owner_key 호환 로직이 존재했다.
- DB 조사 중 데이터 자체를 수정하지 않았다.

---

## 29. 현재까지의 강한 근거

**[강한 근거]**

- 과거 owner_key ≈ device_id 구조 때문에 동일 값이 여러 저장소에 나타날 수 있다.
- b824...는 개인 계정 ID라기보다 익명 Context / Device / Owner 계열 키였을 가능성이 높다.
- public.corenull_houses가 현재 House 구조의 중심으로 이동하고 있는 것으로 보인다.
- 기존 CoreHub DB 데이터 상당수는 초기 개발/API 검증 잔여 데이터일 가능성이 높다.
- CoreNull → CoreHub 전달 실패가 사용자 흐름에 드러나지 않을 가능성이 있다.

---

## 30. 미확인 사항

다음은 아직 확정하지 않는다.

```
1. tester-me-001이 실제 CoreNull POST로 생성되었는가
2. tester-me-001 당시 배포된 CoreHub 코드가 Git과 완전히 동일했는가
3. CoreHub pipeline이 실행되었으나 내부 오류가 발생했는가
4. pushFact 실패가 실제로 있었는가
5. 2026-09-06 b824... 번역 로그를 생성한 정확한 runtime path
6. corenull.houses → public.corenull_houses 전환의 정확한 공식 시점/의도
7. Random Warehouse의 실제 구현이 경험 기반 discovery인지
8. CoreHub의 현재 Production 데이터 정책
9. CoreRing → CoreHub의 최종 연결 방식
10. HajunAI → CoreHub의 최종 Context 소비 방식
```

---

## 31. 다음 조사 순서

현재 우선순위는 구조를 다시 만드는 것이 아니다.

```
① CoreRing A3 마무리
      ↓
② CoreHub 실제 runtime 연결 확인
      ↓
③ CoreHub ↔ CoreRing 연결 지점 확인
      ↓
④ HajunAI Context 연결 확인
      ↓
⑤ 전체 Message → Context 흐름 검증
      ↓
⑥ 필요한 부분만 최소 연결
```

---

## 32. 최종 관점

BRAINPOOL의 핵심은 AI가 사람을 기억하는 시스템이 아니다.

```
사람
 ↓
경험
 ↓
메시지
 ↓
관계
 ↓
패턴
 ↓
의미
 ↓
새로운 연결
 ↓
새로운 경험
```

사람의 이름을 몰라도 된다.  
개인의 프로필을 만들지 않아도 된다.

중요한 것은 사람들이 남긴 경험이 서로 연결되는 것이다.

따라서 BRAINPOOL의 방향은 다음 한 문장으로 정리할 수 있다.

> 사람을 기억하는 시스템이 아니라, 사람들이 남긴 경험의 패턴을 기억하고 연결하는 시스템.

그리고 이 생태계에서 CoreNull, CoreRing, CoreHub, HajunAI는 서로 다른 시스템이 아니라 각각 다른 역할을 수행하는 계층이다.

```
CoreNull
경험을 남긴다.

CoreRing
경험의 의미를 해석한다.

CoreHub
경험 사이의 관계를 찾는다.

HajunAI
관계와 의미를 맥락으로 종합한다.

BRAINPOOL
그 결과 새로운 경험이 다시 생긴다.
```

경험 → 관계 → 의미 → 새로운 경험  
이 순환이 BRAINPOOL 생태계의 핵심이다.

---

## 문서 사용 규칙

이 문서는 현재까지의 조사 결과를 보존하기 위한 기준 문서다.

새로운 코드나 DB를 발견하면 기존 내용을 임의로 덮어쓰지 않고,

```
기존 확인 내용
+
새로운 증거
+
변경된 상태
```

형태로 갱신한다.

특히 미확인 사항은 실제 코드·DB·runtime 근거가 확보되기 전까지 확정 사항으로 승격하지 않는다.

설계보다 실제 흐름을 우선한다.  
재설계보다 연결을 우선한다.  
추측보다 증거를 우선한다.
