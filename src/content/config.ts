import { defineCollection, z } from 'astro:content';

const teachers = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      title: z.string().describe('職稱，如：數學科主任'),
      photo: image().optional(),
      education: z.array(z.string()).default([]),
      yearsOfExperience: z.number().int().nonnegative().default(0),
      subjects: z.array(z.string()).default([]),
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
      priceRange: z.string().optional(),
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
  posts,
  testimonials,
  faq,
  landing,
  site,
};
