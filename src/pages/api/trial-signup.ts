import type { APIRoute } from 'astro';
import { trialSchema, GRADE_TO_STAGE, type TrialFormParsed, type TrialFormOptions } from '~/lib/trialSchema';
import { getTrialFormOptions } from '~/lib/classData';
import { getSupabaseAdmin } from '~/lib/supabase';

const WEEKDAY_LABELS = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'] as const;

/** 解析家長關係：選「其他」時取自填文字。 */
function relationText(d: TrialFormParsed): string {
  return d.relation === '其他' ? (d.relationOther?.trim() || '其他') : d.relation;
}

// SSR endpoint（hybrid 模式下，個別頁面標記 prerender = false 即可）
export const prerender = false;

/* ------------------------------------------------------------------ */
/*  錯誤代碼                                                          */
/* ------------------------------------------------------------------ */
type ErrorCode =
  | 'INVALID_INPUT'
  | 'INVALID_JSON'
  | 'TURNSTILE_FAILED'
  | 'EMAIL_FAILED'
  | 'RATE_LIMITED'
  | 'METHOD_NOT_ALLOWED'
  | 'CORS_FORBIDDEN'
  | 'SERVER_ERROR';

/* ------------------------------------------------------------------ */
/*  in-memory rate limit（best-effort，因 cold start 重置）            */
/* ------------------------------------------------------------------ */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;

interface Bucket {
  count: number;
  resetAt: number;
}
const rateBuckets = new Map<string, Bucket>();

function takeRateLimit(key: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true };
  }
  if (bucket.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}

// 偶發清理過期 bucket（避免長壽 lambda 累積）
function gcBuckets() {
  if (rateBuckets.size < 256) return;
  const now = Date.now();
  for (const [k, v] of rateBuckets) {
    if (v.resetAt <= now) rateBuckets.delete(k);
  }
}

/* ------------------------------------------------------------------ */
/*  CORS                                                              */
/* ------------------------------------------------------------------ */
function getAllowedOrigins(): string[] {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL as string | undefined) ?? 'https://jobsedu.com.tw';
  return [
    siteUrl,
    'https://jobsedu.com.tw',
    'http://localhost:4321',
    'http://localhost:3000',
  ];
}

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const allowOrigin = origin && allowed.includes(origin) ? origin : allowed[0]!;
  return {
    'access-control-allow-origin': allowOrigin,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '600',
    vary: 'origin',
  };
}

/* ------------------------------------------------------------------ */
/*  Turnstile                                                         */
/* ------------------------------------------------------------------ */
async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY ?? import.meta.env.TURNSTILE_SECRET_KEY;
  // 沒設 secret -> 開發/預覽環境，跳過驗證
  if (!secret) {
    console.warn('[trial-signup] TURNSTILE_SECRET_KEY 未設定，跳過 Turnstile 驗證');
    return true;
  }
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret: String(secret), response: token });
    if (ip) body.append('remoteip', ip);
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const json = (await res.json()) as { success?: boolean };
    return Boolean(json.success);
  } catch (err) {
    console.error('[trial-signup] Turnstile verify error', err);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Resend 寄信                                                       */
/* ------------------------------------------------------------------ */
interface SendMailResult {
  ok: boolean;
  mode: 'sent' | 'noop';
  error?: string;
}

async function sendNotifications(data: TrialFormParsed, options: TrialFormOptions | null): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY ?? import.meta.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[trial-signup] RESEND_API_KEY 未設定，已收到表單但不寄信（noop 模式）');
    return { ok: true, mode: 'noop' };
  }
  const fromAddr =
    (process.env.NOTIFY_EMAIL_FROM as string | undefined) ??
    (import.meta.env.NOTIFY_EMAIL_FROM as string | undefined) ??
    'noreply@jobsedu.com.tw';
  const toAddr =
    (process.env.NOTIFY_EMAIL_TO as string | undefined) ??
    (import.meta.env.NOTIFY_EMAIL_TO as string | undefined) ??
    'hwjnctucsie92@gmail.com';

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(String(apiKey));

    // 業主通知信（表單已無 email 欄位，故不再寄家長自動回覆）。
    const ownerHtml = renderOwnerEmail(data, options);
    const ownerRes = await resend.emails.send({
      from: `賈伯斯數理教室 <${fromAddr}>`,
      to: [toAddr],
      subject: `【試聽申請】${data.name} / ${data.grade} / ${data.phone}`,
      html: ownerHtml,
    });
    if (ownerRes.error) {
      console.error('[trial-signup] Resend owner email error', ownerRes.error);
      return { ok: false, mode: 'sent', error: ownerRes.error.message };
    }

    return { ok: true, mode: 'sent' };
  } catch (err) {
    console.error('[trial-signup] Resend send exception', err);
    return { ok: false, mode: 'sent', error: err instanceof Error ? err.message : 'unknown' };
  }
}

/** locationKey → 顯示名稱（取不到 options 時退回 key）。 */
function locationLabel(key: string, options: TrialFormOptions | null): string {
  const loc = options?.locations.find((l) => l.key === key);
  return loc ? `${loc.name}` : key;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderOwnerEmail(d: TrialFormParsed, options: TrialFormOptions | null): string {
  const rows: Array<[string, string]> = [
    ['學生姓名', d.name],
    ['家長電話', d.phone],
    ['家長關係', relationText(d)],
    ['就讀學校', d.school],
    ['年級', d.grade],
    ['備註', d.notes && d.notes !== '' ? d.notes : '（無）'],
  ];
  const tr = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;background:#F5EFE6;color:#3E342B;font-weight:600;width:120px;">${escapeHtml(k)}</td><td style="padding:6px 12px;color:#1F1A16;">${escapeHtml(v)}</td></tr>`,
    )
    .join('');

  // 選課明細：每科一列（科目 / 星期 / 地點）。Python 等自帶完整命名者不加年級前綴。
  const subjectLabel = (subject: string) => (subject.includes('Python') ? subject : `${d.grade}${subject}`);
  const selRows = d.selections
    .map(
      (s) =>
        `<tr><td style="padding:6px 12px;border-bottom:1px solid #E8DFD2;color:#1F1A16;">${escapeHtml(subjectLabel(s.subject))}</td><td style="padding:6px 12px;border-bottom:1px solid #E8DFD2;color:#1F1A16;">${escapeHtml(WEEKDAY_LABELS[s.weekday] ?? String(s.weekday))}</td><td style="padding:6px 12px;border-bottom:1px solid #E8DFD2;color:#1F1A16;">${escapeHtml(locationLabel(s.locationKey, options))}</td></tr>`,
    )
    .join('');

  return `<!doctype html><html><body style="font-family:'Noto Sans TC',sans-serif;background:#F5EFE6;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#FFFEFB;border:1px solid #E8DFD2;border-radius:12px;padding:24px;">
    <h1 style="font-family:'Noto Serif TC',serif;color:#3E342B;font-size:22px;margin:0 0 16px;">新試聽申請</h1>
    <p style="color:#1F1A16;line-height:1.6;margin:0 0 16px;">收到一筆新的試聽預約，請於 1 個工作日內聯絡。</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${tr}</table>
    <h2 style="font-family:'Noto Serif TC',serif;color:#3E342B;font-size:16px;margin:20px 0 8px;">試聽科目與時段</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><th style="padding:6px 12px;text-align:left;background:#F5EFE6;color:#3E342B;">科目</th><th style="padding:6px 12px;text-align:left;background:#F5EFE6;color:#3E342B;">星期</th><th style="padding:6px 12px;text-align:left;background:#F5EFE6;color:#3E342B;">地點</th></tr>
      ${selRows}
    </table>
    <p style="color:#7A6F62;font-size:12px;margin:20px 0 0;">送出時間：${escapeHtml(new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }))}</p>
  </div>
  </body></html>`;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  origin: string | null,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(origin),
    },
  });
}

function getClientIp(request: Request): string | null {
  const xff = request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]?.trim() ?? null;
  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    null
  );
}

/* ------------------------------------------------------------------ */
/*  POST                                                              */
/* ------------------------------------------------------------------ */
export const POST: APIRoute = async ({ request }) => {
  const origin = request.headers.get('origin');

  // CORS：限本站 origin（瀏覽器 same-origin 不會帶 origin，跳過）
  if (origin) {
    const allowed = getAllowedOrigins();
    if (!allowed.includes(origin)) {
      return jsonResponse(403, { ok: false, error: 'CORS_FORBIDDEN' satisfies ErrorCode }, origin);
    }
  }

  // Rate limit
  gcBuckets();
  const ip = getClientIp(request) ?? 'unknown';
  const limit = takeRateLimit(ip);
  if (!limit.ok) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'RATE_LIMITED' satisfies ErrorCode,
        retryAfter: limit.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'retry-after': String(limit.retryAfter ?? 60),
          ...corsHeaders(origin),
        },
      },
    );
  }

  // Parse JSON
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse(400, { ok: false, error: 'INVALID_JSON' satisfies ErrorCode }, origin);
  }

  // zod 後端二次驗證
  const parsed = trialSchema.safeParse(payload);
  if (!parsed.success) {
    return jsonResponse(
      400,
      {
        ok: false,
        error: 'INVALID_INPUT' satisfies ErrorCode,
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      },
      origin,
    );
  }

  // 取 DB 驅動選項（Supabase 優先、content 後備）。供白名單檢核與寄信標籤共用。
  let options: TrialFormOptions | null = null;
  try {
    options = await getTrialFormOptions();
  } catch (err) {
    console.warn('[trial-signup] 取選項失敗，略過 DB 白名單檢核', err);
  }

  // DB 白名單檢核：每筆 selection 的 (科目, 星期, 地點) 必須是該年級學制下真實存在
  // 且 published 的開課（class_offerings 投影）。取不到 options 時寬鬆放行（仍寄信入庫）。
  const whitelistError = validateAgainstWhitelist(parsed.data, options);
  if (whitelistError) {
    return jsonResponse(
      400,
      { ok: false, error: 'INVALID_INPUT' satisfies ErrorCode, detail: whitelistError },
      origin,
    );
  }

  // Turnstile 驗證
  const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken, ip === 'unknown' ? null : ip);
  if (!turnstileOk) {
    return jsonResponse(
      400,
      { ok: false, error: 'TURNSTILE_FAILED' satisfies ErrorCode },
      origin,
    );
  }

  // 先寫入 Supabase（service_role）—— 名單為第一優先，絕不可因寄信失敗而遺失。
  // 未設 key → noop 降級；寫入失敗只記 log 不阻擋回應。一科一列。
  await persistSignup(parsed.data, request);

  // 再寄信通知（best-effort）。寄信失敗（如 Resend 寄件網域未驗證）只記 log，
  // 不讓家長看到「送出失敗」——名單已進 DB，業主可從後台補聯絡。
  const mailResult = await sendNotifications(parsed.data, options);
  if (!mailResult.ok) {
    console.error('[trial-signup] 寄信失敗但名單已入庫，回應仍視為成功', mailResult.error);
  }

  // 成功（名單已入庫即算成功）
  return jsonResponse(
    200,
    {
      ok: true,
      mode: mailResult.ok ? mailResult.mode : 'mail_failed',
      message: '已收到，將於 1 個工作日內聯絡您',
    },
    origin,
  );
};

/* ------------------------------------------------------------------ */
/*  DB 白名單檢核                                                      */
/* ------------------------------------------------------------------ */
/**
 * 對照 getTrialFormOptions() 的 availability（已過濾 published 的開課聯集），檢核每筆
 * selection 的 (科目, 星期, 地點) 在該年級學制下確實存在。回傳 null 表通過；回傳字串
 * 表第一個違規原因。取不到 options 時採寬鬆放行，避免擋掉正常送單（仍寄信入庫）。
 */
function validateAgainstWhitelist(d: TrialFormParsed, options: TrialFormOptions | null): string | null {
  if (!options) return null;

  const stage = GRADE_TO_STAGE[d.grade];
  if (!stage) return `不合法的年級：${d.grade}`;

  // 該學制下合法的 (科目|地點|星期) 組合集合。
  const validCombo = new Set(
    options.availability
      .filter((a) => a.grade === stage)
      .map((a) => `${a.subject}|${a.locationKey}|${a.weekday}`),
  );

  for (const s of d.selections) {
    const key = `${s.subject}|${s.locationKey}|${s.weekday}`;
    if (!validCombo.has(key)) {
      return `不合法的選課：${stage}${s.subject} / ${WEEKDAY_LABELS[s.weekday] ?? s.weekday} / ${locationLabel(s.locationKey, options)}`;
    }
  }

  // 課程歸因 slug（選填）若有帶，需存在。
  if (d.courseSlug && d.courseSlug !== '') {
    if (!options.courses.some((c) => c.slug === d.courseSlug)) {
      return `不合法的課程：${d.courseSlug}`;
    }
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Supabase 寫入（trial_signups）                                    */
/* ------------------------------------------------------------------ */
async function persistSignup(d: TrialFormParsed, request: Request): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    console.warn('[trial-signup] SUPABASE_SERVICE_ROLE_KEY 未設定，跳過 DB 寫入（noop 模式）');
    return;
  }
  // turnstileToken 不入庫（屬一次性驗證 token）。整筆申請的 payload 留存 raw（每列複製，無妨）。
  const { turnstileToken: _drop, ...payload } = d;
  const submissionId = crypto.randomUUID();
  const relation = relationText(d);
  const source = request.headers.get('referer') ?? 'web';

  // 一筆申請含多科 → 各科在 trial_signups 各自一列（聯絡資訊重覆不省）。
  const rows = d.selections.map((s) => ({
    submission_id: submissionId,
    name: d.name,
    phone: d.phone,
    parent_relation: relation,
    school: d.school,
    grade: d.grade,
    subject: s.subject,
    weekday: s.weekday,
    location_key: s.locationKey,
    course_slug: d.courseSlug && d.courseSlug !== '' ? d.courseSlug : null,
    notes: d.notes && d.notes !== '' ? d.notes : null,
    source,
    raw: payload,
  }));

  try {
    const { error } = await sb.from('trial_signups').insert(rows);
    if (error) {
      console.error('[trial-signup] Supabase insert 失敗（不阻擋回應）', error.message);
    }
  } catch (err) {
    console.error('[trial-signup] Supabase insert 例外（不阻擋回應）', err);
  }
}

/* ------------------------------------------------------------------ */
/*  OPTIONS（CORS preflight）                                         */
/* ------------------------------------------------------------------ */
export const OPTIONS: APIRoute = ({ request }) => {
  const origin = request.headers.get('origin');
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
};

/* ------------------------------------------------------------------ */
/*  GET（顯示說明）                                                    */
/* ------------------------------------------------------------------ */
export const GET: APIRoute = ({ request }) => {
  const origin = request.headers.get('origin');
  return jsonResponse(
    405,
    {
      ok: false,
      error: 'METHOD_NOT_ALLOWED' satisfies ErrorCode,
      message: 'POST only',
    },
    origin,
  );
};
