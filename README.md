# BRAINPOOL OS — Core Engine

Framework-agnostic engine core.
모든 모듈은 contracts/ctx.md의 규격을 따릅니다.

## 구조
`
contracts/    ctx 규격 (계약서)
connectors/   Supabase 단일 접근점
hajun/        엔진 라우터 (route만, 판단 없음)
engines/
  translation/  캐시확인 → 번역 → 저장
  language/     언어 감지 (범용)
  emotion/      감정 분석 (번역과 분리)
`

## Next.js에서 사용 (예시)
`	s
import { route }     from 'brainpool-os/hajun';
import { createCtx } from 'brainpool-os/contracts';

export async function POST(req: Request) {
  const body = JSON.parse(await req.text());
  let ctx = createCtx({ text: body.text });
  ctx = await route('translate', ctx);
  ctx = await route('emotion', ctx);
  return Response.json({ payload: ctx.payload, traceId: ctx.traceId });
}
`

## 환경변수
`
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DEEPL_API_KEY=...
`

## 다음에 추가될 엔진
- engines/chat/   (brainpool-clean 정리 후 이식)

## 포함하지 않는 것
- CoreNull (별도 레포로 분리 예정)
- UI 컴포넌트
- Next.js 라우트
