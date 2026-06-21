import { z } from 'zod';

/**
 * 試聽表單共享 schema（前端 + 後端共用），確保前後端驗證一致。
 *
 * 對應 RFP §5.2 試聽預約表單欄位。
 * email 欄位為自動回覆所需（雖然 RFP 未明列，但「自動回覆 email」需要）。
 */

export const GRADES = [
  '國小一',
  '國小二',
  '國小三',
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

/**
 * 試聽科目「預設清單」（fallback）。
 * 實際表單選項由 contact.astro 從 courses collection 的 subject 欄位自動帶入，
 * 編課程 Markdown 即會同步（見 docs/CONTENT_EDITING.md）。此處僅作為未傳入時的後備，
 * 因此驗證採開放字串（subjects 為 string 陣列），不再以列舉鎖死。
 */
export const SUBJECTS = [
  '數學',
  '物理',
  '化學',
  '生物',
  '自然',
  '社會',
  '英文',
  'Python 程式設計',
  '其他',
] as const;

// 固定班實際只在「週一至週五 18:00–21:00」上課；不列不可能排課的下午/週末時段。
// 家教或其他需求走「時段再討論」。
export const TIME_SLOTS = [
  '平日 18:00–21:00',
  '時段再討論',
] as const;

export type Grade = (typeof GRADES)[number];
// 科目為開放字串（選項由課程資料動態帶入），非固定列舉。
export type Subject = string;
export type TimeSlot = (typeof TIME_SLOTS)[number];

export const trialSchema = z.object({
  name: z
    .string()
    .min(2, '請填寫真實姓名（至少 2 字）')
    .max(40, '姓名過長'),
  phone: z
    .string()
    .regex(/^09\d{8}$/u, '請輸入正確的台灣手機格式（09 開頭共 10 碼）'),
  email: z
    .string()
    .email('請輸入有效的 Email')
    .max(120, 'Email 過長')
    .optional()
    .or(z.literal('')),
  school: z.string().max(40, '學校名稱過長').optional().or(z.literal('')),
  grade: z.enum(GRADES, { errorMap: () => ({ message: '請選擇年級' }) }),
  subjects: z
    .array(z.string().min(1).max(20))
    .min(1, '請至少選擇一個諮詢科目')
    .max(12, '選擇的科目過多'),
  preferredTime: z
    .enum(TIME_SLOTS, { errorMap: () => ({ message: '請選擇試聽時段' }) })
    .optional(),
  /** 由課程頁帶入的預設課程 slug（選填，後端對 DB 白名單檢核）。 */
  courseSlug: z.string().max(80, '課程代碼過長').optional().or(z.literal('')),
  /** 指定想找的老師 slug（選填，後端對 DB 白名單檢核）。 */
  preferredTeacherSlug: z.string().max(80, '老師代碼過長').optional().or(z.literal('')),
  /** 希望校區 key（選填；含特殊值 online / discuss，後端對 DB 白名單檢核）。 */
  preferredLocationKey: z.string().max(40, '校區代碼過長').optional().or(z.literal('')),
  notes: z.string().max(500, '備註長度上限 500 字').optional().or(z.literal('')),
  turnstileToken: z.string().optional(),
});

export type TrialFormData = z.input<typeof trialSchema>;
export type TrialFormParsed = z.output<typeof trialSchema>;

/* ------------------------------------------------------------------ */
/*  表單選項型別與年級→學制對照（client-safe，不依賴 astro:content）       */
/*  classData.ts（server-only）會 re-export 這些，供後端組裝選項使用。      */
/* ------------------------------------------------------------------ */
export type Stage = '國小' | '國中' | '高中';

export const GRADE_TO_STAGE: Record<string, Stage> = {
  國小一: '國小', 國小二: '國小', 國小三: '國小', 國小四: '國小', 國小五: '國小', 國小六: '國小',
  國一: '國中', 國二: '國中', 國三: '國中',
  高一: '高中', 高二: '高中', 高三: '高中',
};

/** 試聽表單的 DB 驅動選項（build 時由 getTrialFormOptions() 組裝）。 */
export interface TrialFormOptions {
  grades: string[];
  subjectsByGrade: Record<Stage, string[]>;
  allSubjects: string[];
  teachers: { slug: string; name: string; englishName?: string | null; subjects: string[]; isTutor: boolean }[];
  courses: { slug: string; name: string; grade: string; subject: string; teacherSlug: string }[];
  locations: { key: string; name: string }[];
}
