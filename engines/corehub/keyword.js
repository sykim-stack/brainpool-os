// 관계 키워드 생성
// 실제 포스트 내용에서 키워드 추출

export async function genKeywords(ctx) {
    const { owner_key } = ctx.payload;
    const { supabase } = ctx;
  
    // owner_key가 작성한 포스트 가져오기
    const { data: posts, error } = await supabase
      .from('messages')
      .select('content, meta')
      .eq('type', 'post')
      .order('created_at', { ascending: false })
      .limit(20)
  
    if (error) return { ...ctx, _error: { code: 'KEYWORD_FETCH_FAIL', message: error.message, retryable: true } };
  
    // 포스트 내용에서 단순 키워드 추출 (공백 기준 분리, 2자 이상)
    const allWords = (posts || [])
      .map(p => p.content || '')
      .join(' ')
      .split(/\s+/)
      .filter(w => w.length >= 2)
  
    // 빈도수 계산
    const freq = {};
    for (const word of allWords) {
      freq[word] = (freq[word] || 0) + 1;
    }
  
    // 상위 5개 키워드
    const keywords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  
    return {
      ...ctx,
      payload: {
        ...ctx.payload,
        keywords
      }
    };
  }