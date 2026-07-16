/**
 * SEO 工具函式
 *
 * ⚠ adapter 層：機構事實的唯一權威來源是 src/content/site/info.json，
 * 本檔案只負責讀取＋zod 驗證（siteInfoSchema）＋推導衍生值（brandYears 等），
 * 對外匯出介面（SITE / buildMeta / getActiveSocials …）維持不變，consumer 不必改 import。
 *
 * client-safe：只 import JSON 與 zod（siteSchema.ts 不 import astro:content），
 * 因此 TrialForm.tsx 等 React island 可直接引用（見 responseSla）。
 */
import infoRaw from '~/content/site/info.json';
import { siteInfoSchema } from './siteSchema';

// JSON 壞掉（缺欄位/型別不符）時，build 立刻報清楚錯誤，而不是讓錯誤悄悄流到頁面上。
const info = siteInfoSchema.parse(infoRaw);

export interface SeoMeta {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  noindex?: boolean;
}

const SITE_NAME = info.name;

/** 品牌資歷（年）：當年 - 創立年份，build 當下計算，逐年自動遞增。 */
export const brandYears = new Date().getFullYear() - info.founded;
/** 版權年份區間文字，如「2014–2026」。 */
export const copyrightRange = `${info.founded}–${new Date().getFullYear()}`;

const DEFAULT_DESCRIPTION = info.descriptionTemplate.replace('{years}', String(brandYears));

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

/**
 * 將長描述精簡成 OG 副標：截斷到約 50 字，盡量在標點處斷句，超出補上省略號。
 * 目的是讓 OG 卡副標簡潔，不要塞整段 description。
 */
export function buildOgSubtitle(raw?: string, max = 50): string {
  if (!raw) return '';
  const text = raw.trim().replace(/\s+/g, ' ');
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  // 嘗試在最後一個標點處斷句，讓副標更自然
  const punct = Math.max(
    slice.lastIndexOf('，'),
    slice.lastIndexOf('。'),
    slice.lastIndexOf('、'),
    slice.lastIndexOf('；'),
    slice.lastIndexOf('·'),
  );
  const base = punct >= max * 0.6 ? slice.slice(0, punct) : slice;
  return base + '…';
}

export function buildOgImageUrl(input: OgImageInput = {}): string {
  const slugRaw = input.slug?.replace(/^\/+|\/+$/g, '') || 'home';
  const params = new URLSearchParams();
  if (input.title) params.set('title', input.title.slice(0, 60));
  const subtitle = buildOgSubtitle(input.subtitle);
  if (subtitle) params.set('subtitle', subtitle);
  const qs = params.toString();
  return `/og/${slugRaw}.png${qs ? `?${qs}` : ''}`;
}

const jobsLocation = info.locations.jobs;

export const SITE = {
  name: info.name,
  legalName: info.legalName,
  url: info.url,
  description: DEFAULT_DESCRIPTION,
  address: {
    streetAddress: jobsLocation.streetAddress,
    addressLocality: jobsLocation.addressLocality,
    addressRegion: jobsLocation.addressRegion,
    postalCode: jobsLocation.postalCode ?? '',
    addressCountry: jobsLocation.addressCountry,
    full: jobsLocation.full,
  },
  phone: info.phone.e164,
  phoneDisplay: info.phone.display,
  email: info.email,
  geo: {
    latitude: jobsLocation.geo?.lat ?? 0,
    longitude: jobsLocation.geo?.lng ?? 0,
  },
  // 營業時間單一資料來源：Footer 與 JSON-LD 一律引用以下欄位，勿在各頁硬寫。
  // ⚠ 2026-07 改為週一至五 17:00–21:30；Google 商家檔案需業主手動同步更新。
  openingHours: info.hours.openingHours,
  openingHoursDisplay: info.hours.display,
  hours: {
    opens: info.hours.opens,
    closes: info.hours.closes,
    days: info.hours.days,
  },
  founded: info.founded,
  socials: {
    instagram: import.meta.env.PUBLIC_INSTAGRAM_URL || info.socials.instagram,
    facebook: import.meta.env.PUBLIC_FACEBOOK_URL || info.socials.facebook,
    youtube: import.meta.env.PUBLIC_YOUTUBE_URL || info.socials.youtube,
    googleBusiness: import.meta.env.PUBLIC_GOOGLE_BUSINESS_URL || info.socials.googleBusiness,
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

/** 服務區域（JSON-LD areaServed 用），如「嘉義市」。 */
export const serviceArea = info.serviceArea;

/** 班級規模／學生數等統計數字（首頁數據區、about、各頁佐證文案共用）。 */
export const stats = info.stats;

/** 客服回覆 SLA 對外文字，如「1 個工作日」。全站 14 處硬寫的單一來源。 */
export const responseSla = info.responseSla;

/** 教室鄰近學校步行時間，如「距嘉中、嘉女步行約 8-12 分鐘」（contact.astro）。 */
export const nearbySchoolsNote = info.nearbySchoolsNote;

/** 公司大事紀（about.astro 用），desc 內 {jobsAddress}/{shinobiAddress} 需呼叫端以 LOCATIONS 代入。 */
export const milestones = info.milestones;
