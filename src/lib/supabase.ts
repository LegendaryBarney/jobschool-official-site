import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client 工廠。
 *
 * - 讀取（公開參考資料：課表、師資、課程、校區）走 publishable / anon key，
 *   可安全出現在前端與 build。
 * - 寫入（試聽報名 trial_signups，RLS 無 anon 政策）走 service_role key，
 *   僅在 server 端（API route）使用，永不外洩到瀏覽器。
 *
 * 所有金鑰皆由環境變數提供；未設定時回傳 null，呼叫端應優雅降級
 * （課表/表單選項改讀 content collections；報名改為僅 email 通知）。
 */

function env(name: string): string | undefined {
  // 同時支援 import.meta.env（build / Astro）與 process.env（Node / Vercel runtime）
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  const fromProc = typeof process !== 'undefined' ? process.env?.[name] : undefined;
  return fromMeta ?? fromProc;
}

const SUPABASE_URL = env('PUBLIC_SUPABASE_URL');
const ANON_KEY = env('PUBLIC_SUPABASE_ANON_KEY');
const SERVICE_ROLE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');

let readClient: SupabaseClient | null | undefined;
let adminClient: SupabaseClient | null | undefined;

/** 公開讀取用 client（anon / publishable）。未設定 env 時回傳 null。 */
export function getSupabaseRead(): SupabaseClient | null {
  if (readClient !== undefined) return readClient;
  if (!SUPABASE_URL || !ANON_KEY) {
    readClient = null;
    return null;
  }
  readClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return readClient;
}

/** Server 端寫入用 client（service_role）。未設定 env 時回傳 null。 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (adminClient !== undefined) return adminClient;
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    adminClient = null;
    return null;
  }
  adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

export const isSupabaseConfigured = Boolean(SUPABASE_URL && ANON_KEY);
