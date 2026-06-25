import { getSupabaseRead } from './supabase';
import { GRADES, type TrialFormOptions } from './trialSchema';

/**
 * 課表 / 師資 / 課程 / 校區的單一資料來源。
 *
 * 策略：**Supabase 優先，content collections 後備**。
 * - 已設定 PUBLIC_SUPABASE_* → 從 Supabase 讀（業主可在 DB 直接維護，rebuild 後同步）。
 * - 未設定 → 從 src/content（teachers / courses / schedule）推導，build 永不失敗、零回歸。
 *
 * 模型：每位老師在他上班的每一天、每間教室，都開設他教的所有課程。
 * 因此「課表列 = 課程(科目+老師)」「欄 = 星期」「格 = 教室」可由
 * 課程目錄 × 老師出席(星期×教室) 完整推導。
 */

export const WEEKDAY_LABELS = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'] as const;

export interface CampusLocation {
  key: string;
  name: string;
  shortLabel: string;
  address: string;
  website?: string | null;
  isPrimary: boolean;
  order: number;
}

export interface ClassTeacher {
  slug: string;
  name: string;
  englishName?: string | null;
  title?: string | null;
  subjects: string[];
  isTutor: boolean;
  format?: string | null;
  order: number;
}

export interface ClassCourse {
  slug: string;
  name: string;
  grade: '國小' | '國中' | '高中';
  subject: string;
  teacherSlug: string;
  trialLessons: number;
  order: number;
}

/** 課表一格的最小單位：某老師某科目在某星期某教室某時段開課。 */
export interface Offering {
  subject: string; // 純科目名（數學/英文/英文作文…）
  grade: '國小' | '國中' | '高中';
  teacherSlug: string;
  teacherName: string;
  englishName?: string | null;
  weekday: number; // 1=週一 … 7=週日
  startTime: string; // 'HH:MM'（固定班一律 18:00–21:00）
  endTime: string;
  locationKey: string;
  locationName: string;
  locationShort: string;
  /** 對應課程班名（如 高一/高二/高三數學三班）；無對應課程則為空。 */
  courseNames: string[];
}

export interface ClassData {
  source: 'supabase' | 'content';
  locations: CampusLocation[];
  teachers: ClassTeacher[];
  courses: ClassCourse[];
  offerings: Offering[];
}

const WEEKDAY_TO_NUM: Record<string, number> = {
  週一: 1, 週二: 2, 週三: 3, 週四: 4, 週五: 5, 週六: 6, 週日: 7,
};

let cache: ClassData | null = null;

/** 取得正規化後的課表資料（含快取，單次 build/request 只查一次）。 */
export async function getClassData(): Promise<ClassData> {
  if (cache) return cache;
  const fromDb = await loadFromSupabase();
  cache = fromDb ?? (await loadFromContent());
  return cache;
}

/* ------------------------------------------------------------------ */
/*  Supabase 來源                                                      */
/* ------------------------------------------------------------------ */
async function loadFromSupabase(): Promise<ClassData | null> {
  const sb = getSupabaseRead();
  if (!sb) return null;
  try {
    const [loc, tch, crs, off] = await Promise.all([
      sb.from('locations').select('*').order('display_order'),
      sb.from('teachers').select('*').order('display_order'),
      sb.from('courses').select('*').order('display_order'),
      sb.from('class_offerings').select('*'),
    ]);
    if (loc.error || tch.error || crs.error || off.error) {
      console.warn('[classData] Supabase 讀取錯誤，改用 content fallback', {
        loc: loc.error?.message, tch: tch.error?.message, crs: crs.error?.message, off: off.error?.message,
      });
      return null;
    }
    return {
      source: 'supabase',
      locations: (loc.data ?? []).map((l) => ({
        key: l.key, name: l.name, shortLabel: l.short_label, address: l.address,
        website: l.website, isPrimary: l.is_primary, order: l.display_order,
      })),
      teachers: (tch.data ?? []).map((t) => ({
        slug: t.slug, name: t.name, englishName: t.english_name, title: t.title,
        subjects: t.subjects ?? [], isTutor: t.is_tutor, format: t.format, order: t.display_order,
      })),
      courses: (crs.data ?? []).map((c) => ({
        slug: c.slug, name: c.name, grade: c.grade, subject: c.subject,
        teacherSlug: c.teacher_slug, trialLessons: c.trial_lessons, order: c.display_order,
      })),
      offerings: (off.data ?? []).map((o) => ({
        subject: o.subject, grade: o.grade,
        teacherSlug: o.teacher_slug, teacherName: o.teacher_name, englishName: o.english_name,
        weekday: o.weekday,
        startTime: String(o.start_time ?? '18:00').slice(0, 5),
        endTime: String(o.end_time ?? '21:00').slice(0, 5),
        locationKey: o.location_key, locationName: o.location_name, locationShort: o.location_short,
        courseNames: o.course_names ?? [],
      })),
    };
  } catch (err) {
    console.warn('[classData] Supabase 連線失敗，改用 content fallback', err);
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Content collections 後備                                           */
/* ------------------------------------------------------------------ */
async function loadFromContent(): Promise<ClassData> {
  const { getCollection } = await import('astro:content');
  const { LOCATIONS } = await import('./locations');

  const teacherEntries = await getCollection('teachers');
  const courseEntries = await getCollection('courses');
  const scheduleEntries = await getCollection('schedule');

  const locations: CampusLocation[] = [
    { key: 'jobs', name: LOCATIONS.jobs.name, shortLabel: '賈伯斯', address: LOCATIONS.jobs.address, website: null, isPrimary: true, order: 1 },
    { key: 'shinobi', name: LOCATIONS.shinobi.name, shortLabel: '忍', address: LOCATIONS.shinobi.address, website: LOCATIONS.shinobi.website ?? null, isPrimary: false, order: 2 },
  ];
  const roomToKey: Record<string, string> = { 賈伯斯: 'jobs', 忍文理: 'shinobi' };

  // 注意：type:'content' 集合的 entry.id 在此 Astro 版本帶副檔名（如 barney.md），
  // 但 schedule.teacherSlug / course.teacher 用的是純 slug，需去除副檔名才能對上。
  const stripExt = (id: string) => id.replace(/\.(md|mdx|json)$/i, '');

  const teachers: ClassTeacher[] = teacherEntries
    .map((t) => ({
      slug: stripExt(t.id),
      name: t.data.name,
      englishName: t.data.englishName ?? null,
      title: t.data.title ?? null,
      subjects: t.data.subjects ?? [],
      isTutor: (t.data.roles ?? []).includes('1v1家教') && !(t.data.roles ?? []).includes('小班'),
      format: null,
      order: t.data.order ?? 0,
    }))
    .sort((a, b) => a.order - b.order);
  const teacherBySlug = new Map(teachers.map((t) => [t.slug, t]));

  const courses: ClassCourse[] = courseEntries
    .map((c) => ({
      slug: stripExt(c.id),
      name: c.data.name,
      grade: c.data.grade,
      subject: c.data.subject,
      teacherSlug: c.data.teacher ?? '',
      trialLessons: (c.data as { trialLessons?: number }).trialLessons ?? 2,
      order: c.data.order ?? 0,
    }))
    .sort((a, b) => a.order - b.order);

  // 老師出席：schedule JSON 的 rooms[{room, days}]
  type Avail = { locationKey: string; weekday: number };
  const availByTeacher = new Map<string, Avail[]>();
  for (const s of scheduleEntries) {
    const slug = s.data.teacherSlug;
    if (!slug) continue;
    const list: Avail[] = [];
    for (const room of s.data.rooms) {
      const locationKey = roomToKey[room.room] ?? room.room;
      for (const day of room.days as string[]) {
        const weekday = WEEKDAY_TO_NUM[day];
        if (weekday) list.push({ locationKey, weekday });
      }
    }
    availByTeacher.set(slug, list);
  }

  // 課程班名查找：teacher|grade|subject → [班名]（依 order）。
  const courseNamesByKey = new Map<string, string[]>();
  for (const c of [...courses].sort((a, b) => a.order - b.order)) {
    const k = `${c.teacherSlug}|${c.grade}|${c.subject}`;
    courseNamesByKey.set(k, [...(courseNamesByKey.get(k) ?? []), c.name]);
  }

  // 每位固定班老師可教的 (科目, 學制) 集合 = 解析 teacher.subjects ∪ 課程目錄。
  const locByKey = new Map(locations.map((l) => [l.key, l]));
  const offerings: Offering[] = [];
  for (const [slug, avail] of availByTeacher) {
    const teacher = teacherBySlug.get(slug);
    if (!teacher) continue;
    const subjSet = new Map<string, { subject: string; grade: '國小' | '國中' | '高中' }>();
    for (const raw of teacher.subjects) {
      const parsed = parseTeacherSubject(raw);
      if (parsed) subjSet.set(`${parsed.grade}|${parsed.subject}`, parsed);
    }
    for (const c of courses) {
      if (c.teacherSlug === slug) subjSet.set(`${c.grade}|${c.subject}`, { subject: c.subject, grade: c.grade });
    }
    for (const { subject, grade } of subjSet.values()) {
      const courseNames = courseNamesByKey.get(`${slug}|${grade}|${subject}`) ?? [];
      for (const a of avail) {
        const loc = locByKey.get(a.locationKey);
        if (!loc) continue;
        offerings.push({
          subject,
          grade,
          teacherSlug: slug,
          teacherName: teacher.name,
          englishName: teacher.englishName,
          weekday: a.weekday,
          startTime: '18:00',
          endTime: '21:00',
          locationKey: loc.key,
          locationName: loc.name,
          locationShort: loc.shortLabel,
          courseNames,
        });
      }
    }
  }

  return { source: 'content', locations, teachers, courses, offerings };
}

/**
 * 把 teacher.subjects 一筆（可能含學制前綴或特殊命名）解析成 {純科目, 學制}。
 * 無法判斷學制者回 null（不亂猜）。固定班時段一律 18:00–21:00。
 */
function parseTeacherSubject(raw: string): { subject: string; grade: '國小' | '國中' | '高中' } | null {
  const s = raw.trim();
  if (s.includes('Python')) return { subject: 'Python 程式設計', grade: '國中' };
  if (s.includes('英文作文')) return { subject: '英文作文', grade: '高中' };
  if (s.includes('銜接')) return { subject: '數學', grade: '國中' };
  const grade = s.startsWith('高中') ? '高中' : s.startsWith('國中') ? '國中' : null;
  if (!grade) return null;
  return { subject: s.replace(/^(國中|高中)/, '').trim() || s, grade };
}

/* ------------------------------------------------------------------ */
/*  表單選項衍生：給試聽表單用的合法選項與級聯資料                       */
/*  型別與 GRADE_TO_STAGE 定義於 trialSchema.ts（client-safe），此處 re-export。 */
/* ------------------------------------------------------------------ */
export { GRADE_TO_STAGE } from './trialSchema';
export type { TrialFormOptions } from './trialSchema';

export async function getTrialFormOptions(): Promise<TrialFormOptions> {
  const data = await getClassData();
  // 科目選項「以課表(offerings)為唯一來源」→ 試聽表與課表保證一致。
  const subjectsByGrade: Record<'國小' | '國中' | '高中', Set<string>> = { 國小: new Set(), 國中: new Set(), 高中: new Set() };
  for (const o of data.offerings) subjectsByGrade[o.grade].add(o.subject);
  const allSubjects = [...new Set([...subjectsByGrade['國小'], ...subjectsByGrade['國中'], ...subjectsByGrade['高中']])];

  // availability：每個 (學制, 科目) 的「星期×地點」聯集（去重；不外露老師）。
  // 來源 offerings 已是 published 課堂粒度 → 試聽 bullet 與課表保證一致。
  const availMap = new Map<string, TrialFormOptions['availability'][number]>();
  for (const o of data.offerings) {
    const key = `${o.grade}|${o.subject}|${o.locationKey}|${o.weekday}`;
    if (availMap.has(key)) continue;
    availMap.set(key, {
      grade: o.grade,
      subject: o.subject,
      locationKey: o.locationKey,
      locationName: o.locationName,
      locationShort: o.locationShort,
      weekday: o.weekday,
    });
  }

  return {
    grades: [...GRADES],
    subjectsByGrade: { 國小: [...subjectsByGrade['國小']], 國中: [...subjectsByGrade['國中']], 高中: [...subjectsByGrade['高中']] },
    allSubjects,
    availability: [...availMap.values()],
    courses: data.courses.map((c) => ({ slug: c.slug, name: c.name, grade: c.grade, subject: c.subject, teacherSlug: c.teacherSlug })),
    locations: data.locations.map((l) => ({ key: l.key, name: l.name, shortLabel: l.shortLabel })),
  };
}
