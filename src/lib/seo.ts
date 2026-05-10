/**
 * SEO 工具函式（Phase 2/4 將擴充）
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
  '嘉義在地的精英小班補習機構，由台清交資歷師資領軍，13 年以上教學經驗，專攻國中至高中數理科目。';

export function buildTitle(pageTitle?: string): string {
  if (!pageTitle || pageTitle === SITE_NAME) return `${SITE_NAME} | 嘉義精英小班補習`;
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

export const SITE = {
  name: SITE_NAME,
  url: 'https://jobsedu.com.tw',
  description: DEFAULT_DESCRIPTION,
  address: '嘉義市東區康樂街 10 號',
  phone: '(05)223-0303',
  geo: { latitude: 23.4801, longitude: 120.4498 },
};
