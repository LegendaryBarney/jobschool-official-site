/**
 * 校區常數
 * - 賈伯斯數理教室（jobs）：主品牌，2014 成立、2017 入駐現址
 * - 忍文理教室（shinobi）：姊妹品牌，2023 開設
 *
 * 注意：忍文理電話暫時與賈伯斯相同，若日後另有獨立電話，再由業主補上。
 */

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

const jobsAddress = '嘉義市東區康樂街 10 號';
const shinobiAddress = '嘉義市西區杭州一街 38 號';

export const LOCATIONS: Record<'jobs' | 'shinobi', LocationInfo> = {
  jobs: {
    key: 'jobs',
    name: '賈伯斯數理教室',
    address: jobsAddress,
    phone: '(05) 223-0303',
    phoneTel: '+886-5-223-0303',
    geo: { lat: 23.4796, lng: 120.4538 },
    ...buildMapUrls(jobsAddress),
  },
  shinobi: {
    key: 'shinobi',
    name: '忍文理教室',
    address: shinobiAddress,
    phone: '(05) 223-0303',
    phoneTel: '+886-5-223-0303',
    parentBrand: 'jobs',
    foundedYear: 2023,
    website: 'https://www.shinobicodeschool.com/',
    ...buildMapUrls(shinobiAddress),
  },
};

export const ALL_LOCATIONS: LocationInfo[] = [LOCATIONS.jobs, LOCATIONS.shinobi];
