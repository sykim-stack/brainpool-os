// 활동점수 계산
// messages 테이블 기반 owner_key 활동 집계

export async function calcScore(ctx) {
    const { owner_key } = ctx.payload;
    const { supabase } = ctx;
  
    // 포스트 수
    const { data: posts, error: postError } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .eq('type', 'post')
  
    if (postError) return { ...ctx, _error: { code: 'SCORE_POST_FAIL', message: postError.message, retryable: true } };
  
    // 방 수 (집주인으로서)
    const { data: houses, error: houseError } = await supabase
      .from('corenull_houses')
      .select('id', { count: 'exact' })
      .eq('owner_key', owner_key)
  
    if (houseError) return { ...ctx, _error: { code: 'SCORE_HOUSE_FAIL', message: houseError.message, retryable: true } };
  
    // 발자취 수 (방문한 곳)
    const { data: footprints, error: footError } = await supabase
      .from('corenull_footprints')
      .select('id', { count: 'exact' })
      .eq('owner_key', owner_key)
  
    if (footError) return { ...ctx, _error: { code: 'SCORE_FOOT_FAIL', message: footError.message, retryable: true } };
  
    // 점수 계산
    // 포스트: 10점, 집 보유: 20점, 방문: 2점
    const postCount = posts?.length || 0
    const houseCount = houses?.length || 0
    const footCount = footprints?.length || 0
  
    const score = (postCount * 10) + (houseCount * 20) + (footCount * 2)
  
    return {
      ...ctx,
      payload: {
        ...ctx.payload,
        score,
        score_detail: { postCount, houseCount, footCount }
      }
    };
  }