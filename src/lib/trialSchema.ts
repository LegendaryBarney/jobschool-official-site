import { z } from 'zod';

/**
 * 試聽表單共享 schema（前端 + 後端共用），確保前後端驗證一致。
 *
 * 改版（2026-06-21）：
 * - 年級下限改「國小四」（小四~高三）。
 * - 移除 email、希望試聽時段、指定老師。
 * - 「諮詢科目」改為「選課」：每科 = (科目 + 選定的星期×地點 單選 bullet)。
 *   科目選項依年級學制過濾；星期×地點為「該年級該科所有老師的開課聯集」（不外露老師）。
 * - 學生姓名(name)、家長電話(phone)、家長關係(relation)、就讀學校(school) 皆必填。
 * - 一筆申請可含多科（科目不可重覆）；後端對 DB 一科一列寫入。
 */

export const GRADES = [
  '國小四',
  '國小五',
  '國小六',
  '國一',
  '國二',
  '國三',
  '高一',
  '高二',
  '高三',
] as const;

export type Grade = (typeof GRADES)[number];
// 科目為開放字串（選項由課程資料動態帶入），非固定列舉。
export type Subject = string;

/** 家長與學生關係的固定選項；選「其他」時以 relationOther 自填。 */
export const RELATIONS = ['父', '母', '其他'] as const;
export type Relation = (typeof RELATIONS)[number];

/** 一筆「選課」：科目 + 使用者選定的試聽星期與地點（皆來自該科開課聯集）。 */
export const selectionSchema = z.object({
  subject: z.string().min(1, '請選擇科目').max(20, '科目名稱過長'),
  weekday: z
    .number({ invalid_type_error: '請選擇試聽星期' })
    .int()
    .min(1, '星期不合法')
    .max(7, '星期不合法'),
  locationKey: z.string().min(1, '請選擇上課地點').max(40, '地點代碼過長'),
});
export type TrialSelection = z.infer<typeof selectionSchema>;

export const trialSchema = z
  .object({
    name: z
      .string()
      .min(2, '請填寫學生真實姓名（至少 2 字）')
      .max(40, '姓名過長'),
    phone: z
      .string()
      .regex(/^09\d{8}$/u, '請輸入正確的台灣手機格式（09 開頭共 10 碼）'),
    relation: z.enum(RELATIONS, { errorMap: () => ({ message: '請選擇與學生的關係' }) }),
    /** relation === '其他' 時必填的自填關係文字。 */
    relationOther: z.string().max(20, '關係文字過長').optional().or(z.literal('')),
    school: z
      .string()
      .min(2, '請填寫就讀學校（畢業生可填原校）')
      .max(40, '學校名稱過長'),
    grade: z.enum(GRADES, { errorMap: () => ({ message: '請選擇年級' }) }),
    /** 一科一列：至少一科，科目不可重覆，每科須選定星期與地點。 */
    selections: z
      .array(selectionSchema)
      .min(1, '請至少選擇一個科目並指定試聽星期/地點')
      .max(12, '選擇的科目過多')
      .refine(
        (arr) => new Set(arr.map((s) => s.subject)).size === arr.length,
        { message: '科目不可重覆' },
      ),
    /** 由課程頁帶入的預設課程 slug（選填，來源歸因用，後端對 DB 白名單檢核）。 */
    courseSlug: z.string().max(80, '課程代碼過長').optional().or(z.literal('')),
    notes: z.string().max(500, '備註長度上限 500 字').optional().or(z.literal('')),
    turnstileToken: z.string().optional(),
  })
  .refine(
    (d) => d.relation !== '其他' || (d.relationOther && d.relationOther.trim() !== ''),
    { message: '選「其他」請填寫關係', path: ['relationOther'] },
  );

export type TrialFormData = z.input<typeof trialSchema>;
export type TrialFormParsed = z.output<typeof trialSchema>;

/* ------------------------------------------------------------------ */
/*  表單選項型別與年級→學制對照（client-safe，不依賴 astro:content）       */
/*  classData.ts（server-only）會 re-export 這些，供後端組裝選項使用。      */
/* ------------------------------------------------------------------ */
export type Stage = '國小' | '國中' | '高中';

export const GRADE_TO_STAGE: Record<string, Stage> = {
  國小四: '國小', 國小五: '國小', 國小六: '國小',
  國一: '國中', 國二: '國中', 國三: '國中',
  高一: '高中', 高二: '高中', 高三: '高中',
};

/** (年級學制, 科目) → 可選的「星期×地點」一格。由 class_offerings（已過濾 published）去重而來。 */
export interface SubjectAvailability {
  grade: Stage;
  subject: string;
  locationKey: string;
  locationName: string;
  locationShort: string;
  weekday: number; // 1=週一 … 7=週日
}

/** 試聽表單的 DB 驅動選項（build 時由 getTrialFormOptions() 組裝）。 */
export interface TrialFormOptions {
  grades: string[];
  subjectsByGrade: Record<Stage, string[]>;
  allSubjects: string[];
  /** 每個 (學制, 科目) 的開課星期×地點聯集（不外露老師）。 */
  availability: SubjectAvailability[];
  /** 課程頁帶入預設科目時的歸因用對照（選填保留）。 */
  courses: { slug: string; name: string; grade: string; subject: string; teacherSlug: string }[];
  locations: { key: string; name: string; shortLabel: string }[];
}
