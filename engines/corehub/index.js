import { calcScore } from './score.js';
import { genKeywords } from './keyword.js';
import { judgeVault } from './vault.js';

export async function run(ctx) {
  if (!ctx?.payload?.owner_key) {
    return { ...ctx, _error: { code: 'MISSING_OWNER_KEY', message: 'owner_key 필요', retryable: false } };
  }

  let c = ctx;
  c = await calcScore(c);    if (c._error) return c;
  c = await genKeywords(c);  if (c._error) return c;
  c = await judgeVault(c);
  return c;
}