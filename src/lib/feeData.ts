import { getSupabaseRead } from './supabase';

/**
 * 收費金額的「即時查詢」層。
 *
 * 業主需求：程式設計／資訊科學季繳價要能實時反映資料庫（由業主在 DB 直接
 * 維護 price 欄位即可同步官網，不必改 code、不必 rebuild）。
 *
 * 策略：**Supabase 優先，查無結果 → 回退到定值**。
 * - 未設定 PUBLIC_SUPABASE_* / 連線失敗 / 該表尚未建立 / 查無列 → 回傳傳入的
 *   fallback 定值（目前定值來源：src/content/fees/policy.json 的季繳價格表）。
 * - 因此在 DB 尚未備妥前，這是一個「假 call」——永遠安全落到定值，畫面不變。
 *
 * TODO(業主)：於 Supabase 建立 course_prices 表後本函式即自動改讀 DB：
 *   create table course_prices (
 *     key         text primary key,   -- 例：'programming_quarterly'
 *     price       integer not null,   -- 純數字（元），例：10800
 *     label       text,
 *     updated_at  timestamptz default now()
 *   );
 *   -- 記得加一條 anon 可讀的 RLS select policy。
 */

/** 價格表的資料庫 key ↔ 前端識別。 */
export const PRICE_KEYS = {
  programmingQuarterly: 'programming_quarterly',
} as const;

/**
 * 依 key 即時查詢單筆價格；查無結果回退到 fallback。
 * 回傳已格式化字串（如「10,800 元」），與 policy.json 定值格式一致。
 */
export async function getFeePrice(key: string, fallback: string): Promise<string> {
  const sb = getSupabaseRead();
  if (!sb) return fallback; // 未設定 Supabase → 用定值

  try {
    const { data, error } = await sb
      .from('course_prices')
      .select('price')
      .eq('key', key)
      .maybeSingle();

    // 查詢錯誤（含表不存在）、無資料、price 為空 → 一律回退定值
    if (error || !data || data.price == null) return fallback;

    // DB price 為純數字（元）→ 格式化為「10,800 元」樣式
    return `${Number(data.price).toLocaleString('en-US')} 元`;
  } catch {
    return fallback; // 連線失敗 → 用定值
  }
}
