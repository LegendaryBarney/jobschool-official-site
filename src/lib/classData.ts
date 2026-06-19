import { getSupabaseRead } from './supabase';
import { GRADE_TO_STAGE, type TrialFormOptions } from './trialSchema';

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
  grade: '國中' | '高中';
  subject: string;
  teacherSlug: string;
  trialLessons: number;
  order: number;
}

/** 課表一格的最小單位：某課程在某星期、某教室開課。 */
export interface Offering {
  courseSlug: string;
  courseName: string;
  grade: '國中' | '高中';
  subject: string;
  teacherSlug: string;
  teacherName: string;
  englishName?: string | null;
  weekday: number; // 1=週一 … 7=週日
  locationKey: string;
  locationName: string;
  locationShort: string;
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
        courseSlug: o.course_slug, courseName: o.course_name, grade: o.grade, subject: o.subject,
        teacherSlug: o.teacher_slug, teacherName: o.teacher_name, englishName: o.english_name,
        weekday: o.weekday, locationKey: o.location_key, locationName: o.location_name,
        locationShort: o.location_short,
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

  const locByKey = new Map(locations.map((l) => [l.key, l]));
  const offerings: Offering[] = [];
  for (const course of courses) {
    const teacher = teacherBySlug.get(course.teacherSlug);
    const avail = availByTeacher.get(course.teacherSlug);
    if (!teacher || !avail) continue; // 無固定班出席（如家教）→ 不入課表
    for (const a of avail) {
      const loc = locByKey.get(a.locationKey);
      if (!loc) continue;
      offerings.push({
        courseSlug: course.slug,
        courseName: course.name,
        grade: course.grade,
        subject: course.subject,
        teacherSlug: course.teacherSlug,
        teacherName: teacher.name,
        englishName: teacher.englishName,
        weekday: a.weekday,
        locationKey: loc.key,
        locationName: loc.name,
        locationShort: loc.shortLabel,
      });
    }
  }

  return { source: 'content', locations, teachers, courses, offerings };
}

/* ------------------------------------------------------------------ */
/*  表單選項衍生：給試聽表單用的合法選項與級聯資料                       */
/*  型別與 GRADE_TO_STAGE 定義於 trialSchema.ts（client-safe），此處 re-export。 */
/* ------------------------------------------------------------------ */
export { GRADE_TO_STAGE } from './trialSchema';
export type { TrialFormOptions } from './trialSchema';

export async function getTrialFormOptions(): Promise<TrialFormOptions> {
  const data = await getClassData();
  const subjectsByGrade: Record<'國中' | '高中', Set<string>> = { 國中: new Set(), 高中: new Set() };
  for (const c of data.courses) subjectsByGrade[c.grade].add(c.subject);
  // 家教科目（無固定班）也納入：依老師可教科目補進對應學制
  for (const t of data.teachers) {
    for (const s of t.subjects) {
      if (s.includes('國中') || s.includes('國小')) subjectsByGrade['國中'].add(normalizeSubject(s));
      else if (s.includes('高中')) subjectsByGrade['高中'].add(normalizeSubject(s));
    }
  }
  const allSubjects = [...new Set([...subjectsByGrade['國中'], ...subjectsByGrade['高中']])];

  return {
    grades: ['國一', '國二', '國三', '高一', '高二', '高三'],
    subjectsByGrade: { 國中: [...subjectsByGrade['國中']], 高中: [...subjectsByGrade['高中']] },
    allSubjects,
    teachers: data.teachers.map((t) => ({ slug: t.slug, name: t.name, englishName: t.englishName, subjects: t.subjects, isTutor: t.isTutor })),
    courses: data.courses.map((c) => ({ slug: c.slug, name: c.name, grade: c.grade, subject: c.subject, teacherSlug: c.teacherSlug })),
    locations: data.locations.map((l) => ({ key: l.key, name: l.name })),
  };
}

/** 把「高中英文」「國中數學」之類含學制前綴的科目，化簡為純科目名。 */
function normalizeSubject(s: string): string {
  return s.replace(/^(國中|高中|國小)/, '').trim() || s;
}
