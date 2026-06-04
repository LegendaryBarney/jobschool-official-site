import { z } from 'zod';

/**
 * 試聽表單共享 schema（前端 + 後端共用），確保前後端驗證一致。
 *
 * 對應 RFP §5.2 試聽預約表單欄位。
 * email 欄位為自動回覆所需（雖然 RFP 未明列，但「自動回覆 email」需要）。
 */

export const GRADES = [
  '國一',
  '國二',
  '國三',
  '高一',
  '高二',
  '高三',
] as const;

export const SUBJECTS = [
  '數學',
  '物理',
  '化學',
  '英文',
  '生物',
  '理化',
  '英文作文',
  '其他',
] as const;

export const TIME_SLOTS = [
  '平日下午',
  '平日晚上',
  '週六上午',
  '週六下午',
  '週日上午',
  '週日下午',
] as const;

export type Grade = (typeof GRADES)[number];
export type Subject = (typeof SUBJECTS)[number];
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
    .array(z.enum(SUBJECTS))
    .min(1, '請至少選擇一個諮詢科目'),
  preferredTime: z
    .enum(TIME_SLOTS, { errorMap: () => ({ message: '請選擇試聽時段' }) })
    .optional(),
  notes: z.string().max(500, '備註長度上限 500 字').optional().or(z.literal('')),
  turnstileToken: z.string().optional(),
});

export type TrialFormData = z.input<typeof trialSchema>;
export type TrialFormParsed = z.output<typeof trialSchema>;
