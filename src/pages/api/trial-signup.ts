import type { APIRoute } from 'astro';
import { trialSchema, type TrialFormParsed } from '~/lib/trialSchema';

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

async function sendNotifications(data: TrialFormParsed): Promise<SendMailResult> {
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

    // 業主通知信
    const ownerHtml = renderOwnerEmail(data);
    const ownerRes = await resend.emails.send({
      from: `賈伯斯數理教室 <${fromAddr}>`,
      to: [toAddr],
      subject: `【試聽申請】${data.name} / ${data.grade} / ${data.phone}`,
      html: ownerHtml,
      replyTo: data.email && data.email !== '' ? data.email : undefined,
    });
    if (ownerRes.error) {
      console.error('[trial-signup] Resend owner email error', ownerRes.error);
      return { ok: false, mode: 'sent', error: ownerRes.error.message };
    }

    // 家長/學生自動回覆
    if (data.email && data.email !== '') {
      const replyHtml = renderAutoReplyEmail(data);
      const replyRes = await resend.emails.send({
        from: `賈伯斯數理教室 <${fromAddr}>`,
        to: [data.email],
        subject: '【賈伯斯數理教室】已收到您的試聽申請',
        html: replyHtml,
      });
      if (replyRes.error) {
        // 自動回覆失敗不阻擋業主通知，只記 log
        console.warn('[trial-signup] Resend auto-reply error', replyRes.error);
      }
    }

    return { ok: true, mode: 'sent' };
  } catch (err) {
    console.error('[trial-signup] Resend send exception', err);
    return { ok: false, mode: 'sent', error: err instanceof Error ? err.message : 'unknown' };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderOwnerEmail(d: TrialFormParsed): string {
  const rows: Array<[string, string]> = [
    ['姓名', d.name],
    ['電話', d.phone],
    ['Email', d.email && d.email !== '' ? d.email : '（未填）'],
    ['就讀學校', d.school && d.school !== '' ? d.school : '（未填）'],
    ['年級', d.grade],
    ['諮詢科目', (d.subjects ?? []).join('、')],
    ['希望時段', d.preferredTime ?? '（未指定）'],
    ['備註', d.notes && d.notes !== '' ? d.notes : '（無）'],
  ];
  const tr = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 12px;background:#F5EFE6;color:#3E342B;font-weight:600;width:120px;">${escapeHtml(k)}</td><td style="padding:6px 12px;color:#1F1A16;">${escapeHtml(v)}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html><body style="font-family:'Noto Sans TC',sans-serif;background:#F5EFE6;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#FFFEFB;border:1px solid #E8DFD2;border-radius:12px;padding:24px;">
    <h1 style="font-family:'Noto Serif TC',serif;color:#3E342B;font-size:22px;margin:0 0 16px;">新試聽申請</h1>
    <p style="color:#1F1A16;line-height:1.6;margin:0 0 16px;">收到一筆新的試聽預約，請於 1 個工作日內聯絡。</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${tr}</table>
    <p style="color:#7A6F62;font-size:12px;margin:20px 0 0;">送出時間：${escapeHtml(new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }))}</p>
  </div>
  </body></html>`;
}

function renderAutoReplyEmail(d: TrialFormParsed): string {
  return `<!doctype html><html><body style="font-family:'Noto Sans TC',sans-serif;background:#F5EFE6;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#FFFEFB;border:1px solid #E8DFD2;border-radius:12px;padding:28px;">
    <h1 style="font-family:'Noto Serif TC',serif;color:#3E342B;font-size:24px;margin:0 0 12px;">已收到您的試聽申請</h1>
    <p style="color:#1F1A16;line-height:1.7;margin:0 0 12px;">${escapeHtml(d.name)} 您好，</p>
    <p style="color:#1F1A16;line-height:1.7;margin:0 0 12px;">感謝您填寫試聽預約表單。我們會於 <strong>1 個工作日內</strong>透過電話 ${escapeHtml(d.phone)} 或您指定的方式與您聯絡，確認試聽時段與相關細節。</p>
    <p style="color:#1F1A16;line-height:1.7;margin:0 0 12px;">若想更快收到課程資訊，歡迎加入我們的 LINE 官方帳號。</p>
    <hr style="border:none;border-top:1px solid #E8DFD2;margin:20px 0;" />
    <p style="color:#7A6F62;font-size:13px;line-height:1.7;margin:0;">
      賈伯斯數理教室<br/>
      嘉義市東區康樂街 10 號 · (05) 223-0303<br/>
      <a href="https://jobsedu.com.tw" style="color:#C8A165;">jobsedu.com.tw</a>
    </p>
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

  // Turnstile 驗證
  const turnstileOk = await verifyTurnstile(parsed.data.turnstileToken, ip === 'unknown' ? null : ip);
  if (!turnstileOk) {
    return jsonResponse(
      400,
      { ok: false, error: 'TURNSTILE_FAILED' satisfies ErrorCode },
      origin,
    );
  }

  // 寄信（若無 RESEND_API_KEY 則進入 noop 優雅降級）
  const mailResult = await sendNotifications(parsed.data);
  if (!mailResult.ok) {
    return jsonResponse(
      502,
      { ok: false, error: 'EMAIL_FAILED' satisfies ErrorCode, detail: mailResult.error },
      origin,
    );
  }

  // 成功：未來如需資料庫，補 Vercel KV / Postgres 即可
  return jsonResponse(
    200,
    {
      ok: true,
      mode: mailResult.mode,
      message:
        mailResult.mode === 'noop'
          ? '已收到，將由人工處理（目前環境未設定寄信服務）'
          : '已收到，將於 1 個工作日內聯絡您',
      // 提示後續可加 DB
      note: '目前僅以 email 通知；未來如需保存查詢，建議補 Vercel KV / Postgres。',
    },
    origin,
  );
};

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
