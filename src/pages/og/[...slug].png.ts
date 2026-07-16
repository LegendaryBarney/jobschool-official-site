import type { APIRoute } from 'astro';
import { ImageResponse } from '@vercel/og';
import { SITE, brandYears } from '~/lib/seo';

// 動態 OG 圖必須在 SSR 跑（hybrid 模式下標記）
export const prerender = false;

/* ------------------------------------------------------------------ */
/*  色票（與 BRAND_GUIDELINES.md §3 對齊）                            */
/* ------------------------------------------------------------------ */
const COLOR = {
  latte: '#F5EFE6',
  cream: '#E8DFD2',
  caramel: '#C8A165',
  espresso: '#7A5C3F',
  charcoal: '#1F1A16',
  sienna: '#A4541F',
  chalk: '#FFFEFB',
} as const;

/* ------------------------------------------------------------------ */
/*  字體載入：satori 不直接吃 Google Fonts，需 fetch woff/ttf buffer  */
/*  使用 Noto Serif TC / Noto Sans TC 透過 jsdelivr CDN 取得 ttf。     */
/*  cache 在 module 層，避免每次 cold start 都載。失敗則 fallback。    */
/* ------------------------------------------------------------------ */
const FONT_URL_SERIF =
  'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSerifTC/hinted/ttf/NotoSerifTC-Bold.ttf';
const FONT_URL_SANS =
  'https://cdn.jsdelivr.net/gh/notofonts/notofonts.github.io/fonts/NotoSansTC/hinted/ttf/NotoSansTC-Regular.ttf';

let fontCache: { serif: ArrayBuffer; sans: ArrayBuffer } | null = null;
let fontLoadFailed = false;

async function loadFonts(): Promise<{ serif: ArrayBuffer; sans: ArrayBuffer } | null> {
  if (fontCache) return fontCache;
  if (fontLoadFailed) return null;
  try {
    const [serifRes, sansRes] = await Promise.all([
      fetch(FONT_URL_SERIF),
      fetch(FONT_URL_SANS),
    ]);
    if (!serifRes.ok || !sansRes.ok) {
      fontLoadFailed = true;
      return null;
    }
    const [serif, sans] = await Promise.all([serifRes.arrayBuffer(), sansRes.arrayBuffer()]);
    fontCache = { serif, sans };
    return fontCache;
  } catch (err) {
    console.warn('[og] 字體載入失敗，將 fallback 到 og-default.png', err);
    fontLoadFailed = true;
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function clamp(s: string | null | undefined, max: number): string {
  if (!s) return '';
  const trimmed = s.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max - 1) + '…';
}

function fallbackRedirect(reqUrl: URL): Response {
  // 退回靜態 og-default.png（保留同 origin，避免跨網域 redirect 在開發環境失敗）
  const target = new URL('/og-default.png', reqUrl.origin);
  return new Response(null, {
    status: 302,
    headers: {
      location: target.toString(),
      'cache-control': 'public, max-age=300',
    },
  });
}

/* ------------------------------------------------------------------ */
/*  GET                                                                */
/* ------------------------------------------------------------------ */
export const GET: APIRoute = async ({ url }) => {
  const title = clamp(url.searchParams.get('title') ?? SITE.name, 60);
  const subtitle = clamp(
    url.searchParams.get('subtitle') ??
      `嘉義精英小班補習 · 臺、交、高師大、嘉大、市北大資歷師資 · ${brandYears} 年品牌資歷`,
    120,
  );

  const fonts = await loadFonts();
  if (!fonts) {
    // 字體載入失敗 → 退回靜態圖
    return fallbackRedirect(url);
  }

  try {
    const node = {
      type: 'div',
      props: {
        style: {
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background:
            `linear-gradient(135deg, ${COLOR.latte} 0%, ${COLOR.cream} 100%)`,
          position: 'relative',
          fontFamily: 'NotoSans',
        },
        children: [
          // 紙感裝飾（細紋理）
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                inset: '0',
                backgroundImage:
                  `radial-gradient(circle at 20% 20%, rgba(122, 92, 63, 0.06) 0px, transparent 1px), radial-gradient(circle at 80% 70%, rgba(122, 92, 63, 0.05) 0px, transparent 1px)`,
                backgroundSize: '24px 24px, 32px 32px',
                display: 'flex',
              },
            },
          },
          // 左上 wordmark
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: COLOR.espresso,
                fontFamily: 'NotoSerif',
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                zIndex: 1,
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '8px',
                      height: '36px',
                      background: COLOR.caramel,
                      borderRadius: '2px',
                      display: 'flex',
                    },
                  },
                },
                SITE.name,
              ],
            },
          },
          // 中間：標題 + 副標
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                zIndex: 1,
                maxWidth: '1000px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontFamily: 'NotoSerif',
                      fontSize: '60px',
                      fontWeight: 700,
                      color: COLOR.charcoal,
                      lineHeight: 1.2,
                      display: 'flex',
                      // 限 2 行（瀏覽器透過 word-break + 高度限制）
                      maxHeight: '160px',
                      overflow: 'hidden',
                    },
                    children: title,
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontFamily: 'NotoSans',
                      fontSize: '24px',
                      color: COLOR.espresso,
                      lineHeight: 1.55,
                      display: 'flex',
                      maxHeight: '110px',
                      overflow: 'hidden',
                    },
                    children: subtitle,
                  },
                },
              ],
            },
          },
          // 右下：caramel 線條 + 域名
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 1,
                color: COLOR.espresso,
                fontFamily: 'NotoSans',
                fontSize: '20px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      color: COLOR.charcoal,
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: '40px',
                            height: '2px',
                            background: COLOR.caramel,
                            display: 'flex',
                          },
                        },
                      },
                      `${SITE.address.addressLocality.replace(/市$/, '')} · ${SITE.address.addressRegion} · ${SITE.address.streetAddress.split(' ')[0]}`,
                    ],
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      letterSpacing: '0.05em',
                    },
                    children: new URL(SITE.url).host,
                  },
                },
              ],
            },
          },
        ],
      },
    } as const;

    return new ImageResponse(node as unknown as React.ReactElement, {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'NotoSerif', data: fonts.serif, style: 'normal', weight: 700 },
        { name: 'NotoSans', data: fonts.sans, style: 'normal', weight: 400 },
      ],
      headers: {
        'cache-control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (err) {
    console.error('[og] ImageResponse 失敗，fallback 靜態 og-default.png', err);
    return fallbackRedirect(url);
  }
};
