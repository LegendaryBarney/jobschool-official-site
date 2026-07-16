import { z } from 'zod';

/**
 * 全站機構事實（src/content/site/info.json）的 zod schema。
 *
 * ⚠ client-safe：本檔案不得 import 'astro:content' 或任何 server-only 模組，
 * 因為 TrialForm.tsx（React island）等 client component 會透過 seo.ts 間接用到本 schema。
 * seo.ts / locations.ts 皆以本 schema 對 info.json 做 zod.parse()，JSON 壞掉時 build 會立刻報錯。
 */

const phoneSchema = z.object({
  /** tel: 連結用的國際格式，如 +886-5-223-0303 */
  e164: z.string().min(1),
  /** 對外顯示格式，如 (05) 223-0303 */
  display: z.string().min(1),
});

const hoursSchema = z.object({
  /** schema.org OpeningHoursSpecification 用的簡寫，如 ['Mo-Fr 17:00-21:30'] */
  openingHours: z.array(z.string()).min(1),
  /** 對外顯示文字 */
  display: z.string().min(1),
  opens: z.string().min(1),
  closes: z.string().min(1),
  days: z.array(z.string()).min(1),
});

const socialsSchema = z.object({
  instagram: z.string(),
  facebook: z.string(),
  youtube: z.string(),
  googleBusiness: z.string(),
});

export const locationKeySchema = z.enum(['jobs', 'shinobi']);

const locationSchema = z.object({
  key: locationKeySchema,
  name: z.string().min(1),
  streetAddress: z.string().min(1),
  addressLocality: z.string().min(1),
  addressRegion: z.string().min(1),
  postalCode: z.string().optional(),
  addressCountry: z.string().min(1),
  /** 完整地址字串，如「嘉義市東區康樂街 10 號」 */
  full: z.string().min(1),
  phone: phoneSchema,
  geo: z.object({ lat: z.number(), lng: z.number() }).optional(),
  /** 姊妹品牌用：指向主品牌 key */
  parentBrand: z.literal('jobs').optional(),
  foundedYear: z.number().int().optional(),
  /** 對外官方網站（如姊妹品牌忍文理），提及品牌時的超連結目標 */
  website: z.string().optional(),
});

const statsSchema = z.object({
  studentsServed: z.number().int().nonnegative(),
  /** 對外顯示文字，如「1000+」 */
  studentsServedDisplay: z.string().min(1),
  classSizeMin: z.number().int().positive(),
  classSizeMax: z.number().int().positive(),
  classTiers: z.array(z.string()).min(1),
  maxTeacherYears: z.number().int().nonnegative(),
});

const milestoneSchema = z.object({
  year: z.string().min(1),
  title: z.string().min(1),
  desc: z.string().min(1),
  link: z.object({ href: z.string(), label: z.string() }).optional(),
});

export const siteInfoSchema = z.object({
  name: z.string().min(1),
  legalName: z.string().min(1),
  url: z.string().url(),
  /**
   * 品牌簡介模板：含 {years} 佔位符，由程式在 build 時以「當年 - founded」代入，
   * 產生 DEFAULT_DESCRIPTION（見 seo.ts）。
   */
  descriptionTemplate: z.string().min(1),
  founded: z.number().int(),
  phone: phoneSchema,
  email: z.string().email(),
  hours: hoursSchema,
  socials: socialsSchema,
  serviceArea: z.string().min(1),
  locations: z.object({
    jobs: locationSchema,
    shinobi: locationSchema,
  }),
  stats: statsSchema,
  /** 客服回覆 SLA 對外文字，如「1 個工作日」 */
  responseSla: z.string().min(1),
  nearbySchoolsNote: z.string().min(1),
  milestones: z.array(milestoneSchema).min(1),
});

export type SiteInfo = z.infer<typeof siteInfoSchema>;
export type LocationData = z.infer<typeof locationSchema>;
