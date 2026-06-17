import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * 課表篩選島（漸進增強）
 *
 * 策略：.astro 已 SSR 完整課表（每列帶 data-* 屬性）。本島只渲染篩選控制列，
 * 並以 DOM 操作切換既有列的顯示／隱藏。關閉 JS 時島不掛載，使用者仍看到完整課表。
 *
 * 對應的 SSR 結構（schedule.astro）：
 *   - 容器：[data-schedule-rows]（每個學制分組各一個 <tbody> 帶 data-grade）
 *   - 列：<tr data-course-row data-subject data-teacher data-grade data-locations data-search>
 *   - 分組標題列：<tr data-group-row data-grade>（隨該組是否有可見列一併切換）
 *   - 空狀態：[data-empty-state]（預設 hidden，全部過濾掉時顯示）
 *   - 計數佔位：[data-result-count]（SSR 顯示總數，島接手後即時更新）
 */

export interface ScheduleFilterRow {
  courseSlug: string;
  courseName: string;
  subject: string;
  teacherName: string;
  englishName?: string | null;
  grade: '國中' | '高中';
  /** 已出現過的教室短標籤（去重） */
  locations: string[];
}

interface ScheduleFilterProps {
  rows: ScheduleFilterRow[];
  subjects: string[];
  teachers: string[];
  /** 教室短標籤清單，如 ['賈伯斯','忍'] */
  locations: string[];
  grades: ('國中' | '高中')[];
}

const ALL = '';

const baseField =
  'h-11 w-full rounded-lg border border-cream bg-chalk px-3 text-sm text-charcoal ' +
  'shadow-sm transition-colors focus:border-caramel focus:outline-none focus:ring-2 ' +
  'focus:ring-caramel/40';

export default function ScheduleFilter({
  rows,
  subjects,
  teachers,
  locations,
  grades,
}: ScheduleFilterProps) {
  const [subject, setSubject] = useState(ALL);
  const [teacher, setTeacher] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [grade, setGrade] = useState(ALL);
  const [query, setQuery] = useState('');

  const rootRef = useRef<HTMLDivElement>(null);

  const hasFilter =
    subject !== ALL ||
    teacher !== ALL ||
    location !== ALL ||
    grade !== ALL ||
    query.trim() !== '';

  // 計算符合的列；同時記錄每個學制分組是否還有可見列。
  const { visibleSlugs, visibleGrades, count } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const slugs = new Set<string>();
    const gradesWithRows = new Set<string>();
    for (const r of rows) {
      if (subject !== ALL && r.subject !== subject) continue;
      if (teacher !== ALL && r.teacherName !== teacher) continue;
      if (grade !== ALL && r.grade !== grade) continue;
      if (location !== ALL && !r.locations.includes(location)) continue;
      if (q) {
        const hay = `${r.subject} ${r.teacherName} ${r.englishName ?? ''} ${r.courseName}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      slugs.add(r.courseSlug);
      gradesWithRows.add(r.grade);
    }
    return { visibleSlugs: slugs, visibleGrades: gradesWithRows, count: slugs.size };
  }, [rows, subject, teacher, location, grade, query]);

  // 將過濾結果套用到 SSR 表格的 DOM。
  useEffect(() => {
    const scope = rootRef.current?.closest('[data-schedule-scope]') ?? document;

    const courseRows = scope.querySelectorAll<HTMLElement>('[data-course-row]');
    courseRows.forEach((el) => {
      const slug = el.getAttribute('data-course-slug') ?? '';
      el.hidden = !visibleSlugs.has(slug);
    });

    // 分組標題列／分組容器：該組無可見列時整組隱藏。
    const groupRows = scope.querySelectorAll<HTMLElement>('[data-group-row]');
    groupRows.forEach((el) => {
      const g = el.getAttribute('data-grade') ?? '';
      el.hidden = !visibleGrades.has(g);
    });

    const emptyState = scope.querySelector<HTMLElement>('[data-empty-state]');
    if (emptyState) emptyState.hidden = count !== 0;

    const tableWrap = scope.querySelector<HTMLElement>('[data-table-wrap]');
    if (tableWrap) tableWrap.hidden = count === 0;
  }, [visibleSlugs, visibleGrades, count]);

  function clearAll() {
    setSubject(ALL);
    setTeacher(ALL);
    setLocation(ALL);
    setGrade(ALL);
    setQuery('');
  }

  return (
    <div ref={rootRef} className="not-prose">
      <div className="rounded-2xl border border-cream bg-cream/30 p-4 lg:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          {/* 搜尋框 */}
          <div className="flex-1">
            <label
              htmlFor="schedule-search"
              className="mb-1.5 block font-serif text-sm font-bold text-charcoal"
            >
              搜尋
            </label>
            <input
              id="schedule-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="輸入科目、老師或課程名稱"
              className={baseField}
              autoComplete="off"
            />
          </div>

          {/* 學制 */}
          <div className="lg:w-32">
            <label
              htmlFor="schedule-grade"
              className="mb-1.5 block font-serif text-sm font-bold text-charcoal"
            >
              學制
            </label>
            <select
              id="schedule-grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={baseField}
            >
              <option value={ALL}>全部</option>
              {grades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* 科目 */}
          <div className="lg:w-40">
            <label
              htmlFor="schedule-subject"
              className="mb-1.5 block font-serif text-sm font-bold text-charcoal"
            >
              科目
            </label>
            <select
              id="schedule-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={baseField}
            >
              <option value={ALL}>全部</option>
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* 老師 */}
          <div className="lg:w-40">
            <label
              htmlFor="schedule-teacher"
              className="mb-1.5 block font-serif text-sm font-bold text-charcoal"
            >
              老師
            </label>
            <select
              id="schedule-teacher"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              className={baseField}
            >
              <option value={ALL}>全部</option>
              {teachers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* 教室 */}
          <div className="lg:w-36">
            <label
              htmlFor="schedule-location"
              className="mb-1.5 block font-serif text-sm font-bold text-charcoal"
            >
              教室
            </label>
            <select
              id="schedule-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={baseField}
            >
              <option value={ALL}>全部</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 結果列：筆數 + 清除 */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-charcoal/70" aria-live="polite" role="status">
            {hasFilter ? (
              <>
                符合篩選的課程：
                <span className="font-bold text-espresso">{count}</span> 門
                <span className="text-charcoal/45"> / 共 {rows.length} 門</span>
              </>
            ) : (
              <>
                共 <span className="font-bold text-espresso">{rows.length}</span> 門課程
              </>
            )}
          </p>
          {hasFilter && (
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-cream bg-chalk px-3.5 text-sm font-medium text-espresso transition-colors hover:border-caramel hover:text-caramel"
            >
              <span aria-hidden="true">×</span>
              清除篩選
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
