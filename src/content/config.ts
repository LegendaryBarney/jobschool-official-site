import { defineCollection, z } from 'astro:content';
import { siteInfoSchema } from '~/lib/siteSchema';

const teachers = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      englishName: z
        .string()
        .optional()
        .describe('英文名／品牌名，如：Barney / Seba / Joker / Sandra / Chili'),
      title: z.string().describe('職稱，如：數學科主任'),
      photo: image().optional(),
      education: z.array(z.string()).default([]),
      yearsOfExperience: z.number().int().nonnegative().default(0),
      subjects: z.array(z.string()).default([]),
      roles: z
        .array(z.enum(['小班', '1v1家教']))
        .default(['小班'])
        .describe('講師身份；Joker 兩個都掛'),
      localTie: z
        .string()
        .optional()
        .describe('在地連結，如：嘉義高中畢業'),
      philosophy: z.string().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(0),
      seoDescription: z.string().optional(),
    }),
});

const courses = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      grade: z.enum(['國小', '國中', '高中']),
      gradeLevel: z.array(z.string()).default([]),
      subject: z.string(),
      teacher: z.string().optional().describe('reference slug to teachers collection'),
      summary: z.string(),
      schedule: z.array(z.string()).default([]),
      classType: z
        .enum(['極小班', '精緻班', '小班'])
        .optional()
        .describe('班級規模：極小班 2-5 / 精緻班 6-10 / 小班 10-14'),
      trialLessons: z
        .number()
        .int()
        .nonnegative()
        .default(2)
        .describe('試聽節數；升高搶救／Python／社會／手作 = 11；其餘 = 2'),
      lessonHours: z
        .number()
        .default(3)
        .describe('每堂時數；國中生物 = 1.5；其餘 = 3'),
      pricePerPack: z
        .string()
        .optional()
        .describe('完整描述，如「9,300 元 / 12 節」；新欄位優先於 priceRange 顯示'),
      priceRange: z.string().optional(),
      cover: image().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(0),
      seoDescription: z.string().optional(),
    }),
});

const tutoring = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      subject: z.string(),
      teacher: z.string().optional().describe('slug 指向 teachers'),
      summary: z.string(),
      format: z.enum(['遠端', '實體', '皆可']).default('實體'),
      trialDuration: z.string().default('1 小時試聽'),
      pricing: z.string().default('依個案需求單獨報價'),
      cover: image().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(0),
      seoDescription: z.string().optional(),
    }),
});

const posts = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().describe('TL;DR，將顯示於文章開頭與 SEO description'),
      published: z.coerce.date(),
      updated: z.coerce.date().optional(),
      author: z.string().default('賈伯斯數理教室'),
      category: z.string().optional(),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

const testimonials = defineCollection({
  type: 'content',
  schema: z.object({
    studentName: z.string(),
    grade: z.string().optional(),
    school: z.string().optional(),
    rating: z.number().min(1).max(5).default(5),
    quote: z.string(),
    videoUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
  }),
});

const faq = defineCollection({
  type: 'content',
  schema: z.object({
    question: z.string(),
    category: z.string().default('一般'),
    order: z.number().default(0),
  }),
});

const landing = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      campaign: z.string().describe('URL slug，如：summer-2026'),
      title: z.string(),
      headline: z.string(),
      subheadline: z.string().optional(),
      heroImage: image().optional(),
      ctaLabel: z.string().default('立即試聽'),
      ctaHref: z.string().default('/contact'),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      published: z.boolean().default(true),
    }),
});

// 全站機構事實唯一權威（src/content/site/info.json）。
// schema 抽到 ~/lib/siteSchema（client-safe），與 seo.ts/locations.ts adapter 共用，避免雙寫。
const site = defineCollection({
  type: 'data',
  schema: siteInfoSchema,
});

const fees = defineCollection({
  type: 'data',
  schema: z.object({
    // 收費方式總覽
    methods: z
      .array(z.object({ name: z.string(), summary: z.string() }))
      .default([]),
    // 季繳
    quarterly: z.object({
      subjects: z.array(z.string()).default([]),
      prices: z
        .array(
          z.object({
            label: z.string(),
            hours: z.string(),
            lessons: z.string(),
            price: z.string(),
          }),
        )
        .default([]),
      seasons: z.array(z.string()).default([]),
      earlyBirdNote: z.string(),
      newStudentNote: z.string(),
    }),
    // 家教
    tutoring: z.object({ description: z.string(), formula: z.string() }),
    // 套裝
    packageCourse: z.object({ description: z.string() }),
    // 客製化
    customized: z.object({ description: z.string() }),
    // 繳費方式
    payment: z.object({
      methods: z
        .array(z.object({ name: z.string(), detail: z.string() }))
        .default([]),
      note: z.string(),
    }),
    // 退費 — 市府規定
    refundGov: z
      .array(z.object({ stage: z.string(), rate: z.string() }))
      .default([]),
    refundGovApplies: z.array(z.string()).default([]),
    // 退費 — 季繳舊生
    refundOldStudent: z.object({
      eligibilityNote: z.string(),
      lateNote: z.string(),
      applies: z.array(z.string()).default([]),
    }),
    // 本班優規退費表（refund.png 重新渲染）
    refundTable: z
      .array(
        z.object({
          consumed: z.string(),
          refund: z.string(),
          highlight: z.boolean().default(false),
          noRefund: z.boolean().default(false),
        }),
      )
      .default([]),
  }),
});

const WEEKDAYS = ['週一', '週二', '週三', '週四', '週五'] as const;

// 課表：每位老師在某教室、某些週次授課的固定班課表資料。
// 純資料驅動，新增/異動老師排程只需改 JSON，不動頁面元件。
const schedule = defineCollection({
  type: 'data',
  schema: z.object({
    teacher: z.string().describe('教師顯示名稱，如：黃韋誌(Barney)'),
    teacherSlug: z.string().optional().describe('對應 teachers collection 的 slug'),
    order: z.number().default(0),
    // 每個教室一筆排程；day 限定為週一至週五
    rooms: z
      .array(
        z.object({
          room: z.enum(['賈伯斯', '忍文理']),
          days: z.array(z.enum(WEEKDAYS)).default([]),
          subjects: z.array(z.string()).default([]).describe('於該教室教授科目'),
        }),
      )
      .default([]),
  }),
});

// 課務政策（請假・補課規則）：書面化內容，以 Markdown 驅動。
const policy = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    section: z.string().describe('區段標題，如：學生請假'),
    order: z.number().default(0),
  }),
});

export const collections = {
  teachers,
  courses,
  tutoring,
  posts,
  testimonials,
  faq,
  landing,
  site,
  fees,
  schedule,
  policy,
};
