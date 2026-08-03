# CoreNull Seed System — 폐기 (Deprecated)

**폐기일**: 2026-08-02  
**대체 문서**: [CoreNull 핵심 원칙 v1.2 (Anchor)](CoreNull_Core_Principles_v1.2.md)  
`doc/directives/CoreNull_Core_Principles_v1.2.md`

---

이 문서(v1.1, 2026-08-01자)는 **폐기**되었다.

Seed/Fruit를 "LifeCycle"(§3, Seed → Growing → Flower → Fruit) 형태의 **상태 머신**으로 서술하고 있었는데, 이는 CoreNull 핵심 원칙 v1.2 §3의 금지어 규칙("시작하다/전환하다/종료하다/단계" 사용 금지)과 충돌한다.

v1.2는 같은 개념을 Room에 붙는 **4개의 독립 스위치**  
(`seed_started_at`, `seed_target_date`, `has_participants`, `harvested`)로 재정의했다.  
상태가 순서대로 진행되는 여정이 아니라, **서로 독립적으로 켜고 끌 수 있는 값**이라는 게 핵심 차이다.

이 문서가 갖고 있던 유효한 원칙  
(Primitive는 Message/Image/Comment뿐이다, Seed는 새 콘텐츠 타입이 아니라 View+State다,  
참여자 수만큼 복제하지 않는다, 컴포넌트 재사용 우선)은 전부 v1.2에 그대로 승계되었다.

**신규 내용은 v1.2 문서를 참고할 것.**

이 파일은 과거 참조용으로만 남겨두고, **새로운 설계 판단의 근거로 인용하지 않는다.**

이전 버전(v1.1) 전문은 git 히스토리에서 확인 가능.
