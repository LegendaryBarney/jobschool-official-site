/**
 * JSON-LD 結構化資料（Phase 4 將完整化）
 * 涵蓋：LocalBusiness、EducationalOrganization、Course、Person、Article、FAQPage、Review
 */
import { SITE } from './seo';

export function localBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'EducationalOrganization'],
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '康樂街 10 號',
      addressLocality: '嘉義市',
      addressRegion: '東區',
      addressCountry: 'TW',
    },
    telephone: SITE.phone,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE.geo.latitude,
      longitude: SITE.geo.longitude,
    },
  };
}
