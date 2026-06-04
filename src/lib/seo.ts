/**
 * SEO 工具函式
 */

export interface SeoMeta {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const SITE_NAME = '賈伯斯數理教室';
const DEFAULT_DESCRIPTION =
  '嘉義在地的精英小班補習機構，由臺大資工碩士領軍，師資來自臺、清、交、嘉義大學、高師大等不同背景，2014 年返鄉創立、品牌資歷 12 年，專攻國中至高中數理與相關科目。';

export function buildTitle(pageTitle?: string): string {
  if (!pageTitle || pageTitle === SITE_NAME) {
    return `${SITE_NAME} | 嘉義精英小班補習`;
  }
  return `${pageTitle} | ${SITE_NAME}`;
}

export function buildMeta(input: Partial<SeoMeta> & { title?: string }): SeoMeta {
  return {
    title: buildTitle(input.title),
    description: input.description ?? DEFAULT_DESCRIPTION,
    canonical: input.canonical,
    image: input.image ?? '/og-default.png',
    type: input.type ?? 'website',
    noindex: input.noindex ?? false,
  };
}

export interface PageMetaInput {
  title?: string;
  description?: string;
  path?: string;
  ogImage?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

export function buildPageMeta(input: PageMetaInput): SeoMeta & { canonical: string } {
  const base = (import.meta.env.PUBLIC_SITE_URL as string) || SITE.url;
  const canonical = input.path ? new URL(input.path, base).toString() : base;
  return {
    title: buildTitle(input.title),
    description: input.description ?? DEFAULT_DESCRIPTION,
    canonical,
    image: input.ogImage ?? '/og-default.png',
    type: input.type ?? 'website',
    noindex: input.noindex ?? false,
  };
}

/**
 * 動態 OG 圖 URL 建構器
 * 路由：/og/{slug}.png?title=...&subtitle=...
 *
 * @example
 *   buildOgImageUrl({ slug: 'posts/why-small-class', title, subtitle: summary })
 *   buildOgImageUrl({ slug: 'home', title: '賈伯斯數理教室' })
 */
export interface OgImageInput {
  slug?: string;
  title?: string;
  subtitle?: string;
  type?: 'website' | 'article';
}

export function buildOgImageUrl(input: OgImageInput = {}): string {
  const slugRaw = input.slug?.replace(/^\/+|\/+$/g, '') || 'home';
  const params = new URLSearchParams();
  if (input.title) params.set('title', input.title.slice(0, 60));
  if (input.subtitle) params.set('subtitle', input.subtitle.slice(0, 120));
  const qs = params.toString();
  return `/og/${slugRaw}.png${qs ? `?${qs}` : ''}`;
}

export const SITE = {
  name: SITE_NAME,
  legalName: '賈伯斯數理教室',
  url: 'https://jobsedu.com.tw',
  description: DEFAULT_DESCRIPTION,
  address: {
    streetAddress: '康樂街 10 號',
    addressLocality: '嘉義市',
    addressRegion: '東區',
    postalCode: '600',
    addressCountry: 'TW',
    full: '嘉義市東區康樂街 10 號',
  },
  phone: '+886-5-223-0303',
  phoneDisplay: '(05) 223-0303',
  email: 'contact@jobsedu.com.tw',
  geo: { latitude: 23.4796, longitude: 120.4538 },
  openingHours: ['Mo-Sa 14:00-22:00'],
  openingHoursDisplay: '週一至週六 14:00–22:00（週日休）',
  founded: 2014,
  socials: {
    instagram: '',
    facebook: '',
    youtube: '',
    googleBusiness: '',
  },
} as const;

export type SocialKey = keyof typeof SITE.socials;

/**
 * 回傳 SITE.socials 中所有非空（去除前後空白後仍有值）的社群連結。
 * 用於 Footer 渲染與 JSON-LD sameAs 串接。
 */
export function getActiveSocials(): Array<{ key: SocialKey; url: string }> {
  return (Object.entries(SITE.socials) as Array<[SocialKey, string]>)
    .map(([key, url]) => ({ key, url: url.trim() }))
    .filter((s) => s.url.length > 0);
}
