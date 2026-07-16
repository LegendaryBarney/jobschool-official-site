/**
 * 校區常數
 * - 賈伯斯數理教室（jobs）：主品牌，2014 成立、2017 入駐現址
 * - 忍文理教室（shinobi）：姊妹品牌，2023 開設
 *
 * ⚠ adapter 層：資料唯一權威來源是 src/content/site/info.json 的 locations 欄位
 * （seo.ts 已做過 siteInfoSchema.parse 驗證），本檔案只負責轉成既有的 LocationInfo 介面
 * ＋推導 mapEmbedSrc/mapLink，對外匯出介面（LOCATIONS/ALL_LOCATIONS）維持不變。
 *
 * 注意：忍文理電話暫時與賈伯斯相同，若日後另有獨立電話，再由業主補上。
 */
import infoRaw from '~/content/site/info.json';
import { siteInfoSchema, type LocationData } from './siteSchema';

const info = siteInfoSchema.parse(infoRaw);

export interface LocationInfo {
  key: 'jobs' | 'shinobi';
  name: string;
  address: string;
  phone: string;
  phoneTel: string;
  geo?: { lat: number; lng: number };
  parentBrand?: 'jobs';
  foundedYear?: number;
  /** 對外官方網站（如姊妹品牌忍文理）。提及品牌時的超連結目標。 */
  website?: string;
  mapEmbedSrc: string;
  mapLink: string;
}

const buildMapUrls = (address: string) => {
  const q = encodeURIComponent(address);
  return {
    mapEmbedSrc: `https://www.google.com/maps?q=${q}&output=embed`,
    mapLink: `https://www.google.com/maps/search/?api=1&query=${q}`,
  };
};

const toLocationInfo = (loc: LocationData): LocationInfo => ({
  key: loc.key,
  name: loc.name,
  address: loc.full,
  phone: loc.phone.display,
  phoneTel: loc.phone.e164,
  geo: loc.geo,
  parentBrand: loc.parentBrand,
  foundedYear: loc.foundedYear,
  website: loc.website,
  ...buildMapUrls(loc.full),
});

export const LOCATIONS: Record<'jobs' | 'shinobi', LocationInfo> = {
  jobs: toLocationInfo(info.locations.jobs),
  shinobi: toLocationInfo(info.locations.shinobi),
};

export const ALL_LOCATIONS: LocationInfo[] = [LOCATIONS.jobs, LOCATIONS.shinobi];

/**
 * 結構化地址資料（schema.org PostalAddress 用途）。
 * 供 jsonld.ts 組 subOrganization 等需要 streetAddress/addressLocality/addressRegion 分欄位的場合，
 * 取代舊有「從 LOCATIONS.address 字串拆解嘉義市西區」的 hack。LocationInfo 介面本身不變。
 */
export const LOCATION_DATA: Record<'jobs' | 'shinobi', LocationData> = info.locations;
