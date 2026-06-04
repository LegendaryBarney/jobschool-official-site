import { defineCollection, z } from 'astro:content';

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
      grade: z.enum(['國中', '高中']),
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

const site = defineCollection({
  type: 'data',
  schema: z.object({
    key: z.string(),
    value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
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
};
