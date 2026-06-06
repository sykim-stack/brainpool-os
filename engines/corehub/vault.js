// 창고 오픈 판단
// 점수 + 키워드 조건 충족 시 오픈

// Phase 0 창고 오픈 조건
const VAULT_CONDITIONS = {
    minScore: 50,       // 최소 활동점수
    minKeywords: 3,     // 최소 관계키워드 수
  }
  
  export async function judgeVault(ctx) {
    const { score, keywords } = ctx.payload;
  
    const scoreOk = score >= VAULT_CONDITIONS.minScore;
    const keywordOk = (keywords || []).length >= VAULT_CONDITIONS.minKeywords;
  
    const vaultOpen = scoreOk && keywordOk;
  
    return {
      ...ctx,
      payload: {
        ...ctx.payload,
        vault: {
          open: vaultOpen,
          conditions: {
            score: { required: VAULT_CONDITIONS.minScore, current: score, met: scoreOk },
            keywords: { required: VAULT_CONDITIONS.minKeywords, current: (keywords || []).length, met: keywordOk },
          }
        }
      }
    };
  }