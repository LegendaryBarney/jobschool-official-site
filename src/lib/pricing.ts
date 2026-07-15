import policy from '~/content/fees/policy.json';
import { getFeePrice, PRICE_KEYS } from './feeData';

/**
 * 課程頁「學費」欄位的單一來源。
 *
 * 定值來源：src/content/fees/policy.json 的 coursePricing（default + overrides）。
 * DB 優先：若該課程 slug 有對應的 Supabase course_prices key，優先即時查 DB，
 * 查無結果則回退到 coursePricing 的定值（沿用 src/lib/feeData.ts 的 getFeePrice）。
 *
 * 因為 DB 只存純金額（如 11400 → 「11,400 元」），而課程頁要顯示的是完整描述
 * （如「11,400 元 / 12 節（每節 3 小時）」），這裡把 coursePricing 定值拆成
 * 「金額」與「堂數／時數說明」兩段，DB 查到的金額只替換前段，後段維持定值。
 */

interface CoursePricing {
  default: string;
  overrides: Record<string, string>;
}

const coursePricing = (policy as unknown as { coursePricing: CoursePricing }).coursePricing;

/** 課程 slug → Supabase course_prices 表的 key。目前只有 Python／資訊科學課即時查 DB。 */
const DB_PRICE_KEY_MAP: Record<string, string> = {
  'python-programming': PRICE_KEYS.programmingQuarterly,
};

/** 定值字串（純同步，不查 DB）：coursePricing.overrides[slug] ?? coursePricing.default。 */
export function getCoursePriceStatic(slug: string): string {
  return coursePricing.overrides[slug] ?? coursePricing.default;
}

/** 把「11,400 元 / 12 節（每節 3 小時）」拆成金額與後段說明，供 DB 金額替換用。 */
function splitAmountAndSuffix(full: string): { amount: string; suffix: string } {
  const idx = full.indexOf(' / ');
  if (idx === -1) return { amount: full, suffix: '' };
  return { amount: full.slice(0, idx), suffix: full.slice(idx) };
}

/**
 * 依 slug 取得課程頁顯示用的學費字串。
 * 有對應 DB key 的課程（目前僅 python-programming）會即時查 Supabase course_prices，
 * 查無結果或未設定 Supabase 時安全回退到 coursePricing 定值，畫面不變。
 */
export async function getCoursePrice(slug: string): Promise<string> {
  const staticFull = getCoursePriceStatic(slug);
  const dbKey = DB_PRICE_KEY_MAP[slug];
  if (!dbKey) return staticFull;

  const { amount, suffix } = splitAmountAndSuffix(staticFull);
  const dbAmount = await getFeePrice(dbKey, amount);
  return `${dbAmount}${suffix}`;
}
