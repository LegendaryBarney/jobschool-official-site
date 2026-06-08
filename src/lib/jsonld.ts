/**
 * JSON-LD 結構化資料工廠函式
 * 涵蓋：LocalBusiness、EducationalOrganization、Course、Person、Article、FAQPage、Review、Breadcrumb
 */
import { SITE, getActiveSocials } from './seo';
import { LOCATIONS, type LocationInfo } from './locations';

export type JsonLd = Record<string, unknown>;

/**
 * 取得 SITE.socials 中非空的 URL 陣列，供 schema.org sameAs 使用。
 * 全部為空時回傳空陣列（呼叫端應以此判斷是否輸出 sameAs 鍵）。
 */
const sameAsUrls = (): string[] => getActiveSocials().map((s) => s.url);

const baseAddress = () => ({
  '@type': 'PostalAddress',
  streetAddress: SITE.address.streetAddress,
  addressLocality: SITE.address.addressLocality,
  addressRegion: SITE.address.addressRegion,
  postalCode: SITE.address.postalCode,
  addressCountry: SITE.address.addressCountry,
});

export function localBusinessJsonLd(): JsonLd {
  const sameAs = sameAsUrls();
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'EducationalOrganization'],
    '@id': `${SITE.url}#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    url: SITE.url,
    description: SITE.description,
    foundingDate: String(SITE.founded),
    address: baseAddress(),
    telephone: SITE.phone,
    email: SITE.email,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.geo.latitude,
      longitude: SITE.geo.longitude,
    },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${SITE.geo.latitude},${SITE.geo.longitude}`,
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '14:00',
        closes: '22:00',
      },
    ],
    areaServed: {
      '@type': 'City',
      name: '嘉義市',
    },
    subOrganization: {
      '@type': 'EducationalOrganization',
      name: LOCATIONS.shinobi.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: LOCATIONS.shinobi.address.replace('嘉義市西區', ''),
        addressLocality: '嘉義市',
        addressRegion: '西區',
        addressCountry: 'TW',
      },
      ...(LOCATIONS.shinobi.foundedYear
        ? { foundingDate: String(LOCATIONS.shinobi.foundedYear) }
        : {}),
    },
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

/**
 * 為單一校區產生 Place / LocalBusiness 結構化資料。
 * 主品牌（jobs）輸出 LocalBusiness + EducationalOrganization 並掛回 #organization；
 * 姊妹品牌（shinobi）輸出 LocalBusiness，並以 parentOrganization 連回主品牌。
 */
export function placeJsonLd(loc: LocationInfo): JsonLd {
  const isMain = loc.key === 'jobs';
  return {
    '@context': 'https://schema.org',
    '@type': isMain ? ['LocalBusiness', 'EducationalOrganization'] : 'LocalBusiness',
    ...(isMain ? { '@id': `${SITE.url}#organization` } : { '@id': `${SITE.url}/locations#${loc.key}` }),
    name: loc.name,
    url: `${SITE.url}/locations`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: loc.address,
      addressLocality: '嘉義市',
      addressCountry: 'TW',
    },
    telephone: loc.phone,
    hasMap: loc.mapLink,
    ...(loc.geo
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: loc.geo.lat,
            longitude: loc.geo.lng,
          },
        }
      : {}),
    ...(loc.foundedYear ? { foundingDate: String(loc.foundedYear) } : {}),
    ...(loc.parentBrand
      ? {
          parentOrganization: {
            '@type': 'EducationalOrganization',
            '@id': `${SITE.url}#organization`,
            name: SITE.name,
          },
        }
      : {}),
  };
}

export function educationalOrgJsonLd(): JsonLd {
  const sameAs = sameAsUrls();
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    '@id': `${SITE.url}#educational`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    address: baseAddress(),
    telephone: SITE.phone,
    foundingDate: String(SITE.founded),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export interface CourseLikeData {
  name: string;
  summary: string;
  subject: string;
  grade: string;
  gradeLevel?: string[];
  schedule?: string[];
  priceRange?: string;
  slug: string;
}

export function courseJsonLd(course: CourseLikeData): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.summary,
    provider: {
      '@type': 'EducationalOrganization',
      '@id': `${SITE.url}#organization`,
      name: SITE.name,
      url: SITE.url,
    },
    educationalLevel: course.grade,
    about: course.subject,
    url: `${SITE.url}/courses/${course.slug}`,
    inLanguage: 'zh-Hant-TW',
  };
}

export function courseInstanceJsonLd(course: CourseLikeData): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'CourseInstance',
    name: course.name,
    courseMode: 'onsite',
    location: {
      '@type': 'Place',
      name: SITE.name,
      address: baseAddress(),
    },
    inLanguage: 'zh-Hant-TW',
    ...(course.schedule && course.schedule.length > 0 ? { eventSchedule: course.schedule } : {}),
  };
}

export interface TeacherLikeData {
  name: string;
  title: string;
  education?: string[];
  yearsOfExperience?: number;
  subjects?: string[];
  philosophy?: string;
  slug: string;
}

export function personJsonLd(teacher: TeacherLikeData): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: teacher.name,
    jobTitle: teacher.title,
    worksFor: {
      '@type': 'EducationalOrganization',
      '@id': `${SITE.url}#organization`,
      name: SITE.name,
    },
    url: `${SITE.url}/teachers/${teacher.slug}`,
    description: teacher.philosophy,
    knowsAbout: teacher.subjects,
    ...(teacher.education && teacher.education.length > 0
      ? {
          alumniOf: teacher.education.map((e) => ({
            '@type': 'EducationalOrganization',
            name: e,
          })),
        }
      : {}),
  };
}

export interface ArticleLikeData {
  title: string;
  summary: string;
  published: Date;
  updated?: Date;
  author?: string;
  cover?: string;
  slug: string;
  tags?: string[];
}

export function articleJsonLd(post: ArticleLikeData): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.summary,
    datePublished: post.published.toISOString(),
    dateModified: (post.updated ?? post.published).toISOString(),
    author: {
      '@type': 'Organization',
      name: post.author ?? SITE.name,
    },
    publisher: {
      '@type': 'EducationalOrganization',
      '@id': `${SITE.url}#organization`,
      name: SITE.name,
      url: SITE.url,
    },
    mainEntityOfPage: `${SITE.url}/posts/${post.slug}`,
    ...(post.cover ? { image: post.cover } : {}),
    ...(post.tags && post.tags.length > 0 ? { keywords: post.tags.join(', ') } : {}),
    inLanguage: 'zh-Hant-TW',
  };
}

export interface BreadcrumbItemLD {
  label: string;
  href?: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItemLD[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.label,
      ...(it.href ? { item: it.href } : {}),
    })),
  };
}

export interface FaqItemLD {
  question: string;
  answer: string;
}

export function faqPageJsonLd(items: FaqItemLD[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  };
}

export interface ReviewLikeData {
  studentName: string;
  rating?: number;
  quote: string;
  grade?: string;
  school?: string;
}

export function reviewJsonLd(t: ReviewLikeData): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: t.rating ?? 5,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Person',
      name: t.studentName,
    },
    reviewBody: t.quote,
    itemReviewed: {
      '@type': 'EducationalOrganization',
      '@id': `${SITE.url}#organization`,
      name: SITE.name,
    },
  };
}

export interface ItemListEntry {
  name: string;
  url: string;
  description?: string;
}

export function itemListJsonLd(items: ItemListEntry[], listName?: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    ...(listName ? { name: listName } : {}),
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: it.url,
      name: it.name,
      ...(it.description ? { description: it.description } : {}),
    })),
  };
}

export function blogJsonLd(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE.name} 部落格`,
    url: `${SITE.url}/posts`,
    publisher: {
      '@type': 'EducationalOrganization',
      '@id': `${SITE.url}#organization`,
      name: SITE.name,
    },
    inLanguage: 'zh-Hant-TW',
  };
}

export function webPageJsonLd(input: { name: string; description?: string; url: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    inLanguage: 'zh-Hant-TW',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE.name,
      url: SITE.url,
    },
  };
}

export function aggregateRatingJsonLd(items: ReviewLikeData[]): JsonLd | null {
  if (items.length === 0) return null;
  const ratings = items.map((t) => t.rating ?? 5);
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: {
      '@type': 'EducationalOrganization',
      '@id': `${SITE.url}#organization`,
      name: SITE.name,
    },
    ratingValue: Number(avg.toFixed(1)),
    reviewCount: items.length,
    bestRating: 5,
    worstRating: 1,
  };
}
