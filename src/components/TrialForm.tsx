import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  trialSchema,
  GRADES,
  SUBJECTS,
  TIME_SLOTS,
  type Grade,
  type Subject,
  type TimeSlot,
  type TrialFormData,
} from '~/lib/trialSchema';
import { GRADE_TO_STAGE, type TrialFormOptions } from '~/lib/trialSchema';

type FieldErrors = Partial<Record<keyof TrialFormData, string>>;

const initialData: TrialFormData = {
  name: '',
  phone: '',
  email: '',
  school: '',
  grade: undefined as unknown as Grade,
  subjects: [],
  preferredTime: undefined,
  courseSlug: '',
  preferredTeacherSlug: '',
  preferredLocationKey: '',
  notes: '',
  turnstileToken: '',
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

/** 校區下拉的特殊值（非實體 DB 校區）。後端白名單會額外接受這兩個 key。 */
const LOCATION_ONLINE = 'online';
const LOCATION_DISCUSS = 'discuss';

interface TrialFormProps {
  endpoint?: string;
  /**
   * DB 驅動的級聯選項（年級 / 科目 / 老師 / 校區）。
   * 由頁面 frontmatter `await getTrialFormOptions()` 帶入。
   * 未傳入時退回 schema 預設常數（向後相容、零回歸）。
   */
  options?: TrialFormOptions;
  /** （向後相容）僅傳科目選項；未提供 options 時使用。 */
  subjectOptions?: readonly string[];
  /** 課程頁帶入的預設課程 slug，連同表單一起送出供後端對應。 */
  defaultCourseSlug?: string;
  /** 課程頁帶入的預設勾選科目。 */
  defaultSubjects?: readonly string[];
}

export default function TrialForm({
  endpoint = '/api/trial-signup',
  options,
  subjectOptions = SUBJECTS,
  defaultCourseSlug,
  defaultSubjects,
}: TrialFormProps) {
  const [data, setData] = useState<TrialFormData>(() => ({
    ...initialData,
    courseSlug: defaultCourseSlug ?? '',
    subjects: defaultSubjects ? [...defaultSubjects] : [],
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const turnstileSiteKey = useMemo(
    () => (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined) ?? '',
    [],
  );
  const lineUrl = (import.meta.env.PUBLIC_LINE_URL as string | undefined) || '#';

  // 已選年級 → 學制（國中 / 高中）
  const stage = data.grade ? GRADE_TO_STAGE[data.grade] : undefined;

  // 級聯①：科目選項依學制過濾；未選年級或無 options 時退回開放清單。
  const subjectChoices = useMemo<string[]>(() => {
    if (options) {
      if (stage) return options.subjectsByGrade[stage] ?? options.allSubjects;
      return options.allSubjects;
    }
    return [...subjectOptions];
  }, [options, stage, subjectOptions]);

  // 級聯②：老師選項依「已選科目 ∩ 老師可教科目」過濾；未選科目時顯示全部（同學制優先）。
  const teacherChoices = useMemo(() => {
    if (!options) return [];
    const picked = data.subjects ?? [];
    const norm = (s: string) => s.replace(/^(國中|高中|國小)/u, '').trim();
    const pickedNorm = new Set(picked.map(norm));
    return options.teachers.filter((t) => {
      if (pickedNorm.size === 0) return true;
      const teacherSubjects = t.subjects.map(norm);
      return teacherSubjects.some((ts) => pickedNorm.has(ts));
    });
  }, [options, data.subjects]);

  // 校區選項：DB 實體校區 + 線上 + 再討論。
  const locationChoices = useMemo(() => {
    const base = options?.locations ?? [];
    return [
      ...base.map((l) => ({ key: l.key, name: l.name })),
      { key: LOCATION_ONLINE, name: '線上 / 遠端' },
      { key: LOCATION_DISCUSS, name: '再討論' },
    ];
  }, [options]);

  function update<K extends keyof TrialFormData>(key: K, value: TrialFormData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  function onGradeChange(next: Grade) {
    setData((prev) => {
      const nextStage = next ? GRADE_TO_STAGE[next] : undefined;
      // 換年級後，把不屬於新學制的已選科目清掉，避免送出非法選項。
      let nextSubjects = prev.subjects ?? [];
      let nextTeacher = prev.preferredTeacherSlug;
      if (options && nextStage) {
        const allowed = new Set(options.subjectsByGrade[nextStage] ?? options.allSubjects);
        nextSubjects = nextSubjects.filter((s) => allowed.has(s));
        if (nextSubjects.length !== (prev.subjects ?? []).length) nextTeacher = '';
      }
      return { ...prev, grade: next, subjects: nextSubjects, preferredTeacherSlug: nextTeacher };
    });
    if (errors.grade) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n.grade;
        return n;
      });
    }
  }

  function toggleSubject(s: Subject) {
    const current = data.subjects ?? [];
    const next = current.includes(s)
      ? current.filter((x) => x !== s)
      : [...current, s];
    // 若取消的科目使目前指定的老師失去交集，順手清掉避免非法送出。
    setData((prev) => {
      let nextTeacher = prev.preferredTeacherSlug;
      if (options && nextTeacher) {
        const norm = (x: string) => x.replace(/^(國中|高中|國小)/u, '').trim();
        const pickedNorm = new Set(next.map(norm));
        const teacher = options.teachers.find((t) => t.slug === nextTeacher);
        const stillValid =
          next.length === 0 ||
          (teacher && teacher.subjects.map(norm).some((ts) => pickedNorm.has(ts)));
        if (!stillValid) nextTeacher = '';
      }
      return { ...prev, subjects: next, preferredTeacherSlug: nextTeacher };
    });
    if (errors.subjects) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n.subjects;
        return n;
      });
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    const result = trialSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof TrialFormData | undefined;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      // 聚焦第一個錯誤欄位，並保留所有已填資料。
      const firstKey = Object.keys(fieldErrors)[0];
      if (firstKey) {
        requestAnimationFrame(() => {
          document
            .querySelector<HTMLElement>(`[data-field="${firstKey}"]`)
            ?.focus?.();
        });
      }
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || '送出失敗，請稍後再試');
      }
      setStatus('success');
      setData({ ...initialData, courseSlug: defaultCourseSlug ?? '' });
    } catch (err) {
      setStatus('error');
      setSubmitError(err instanceof Error ? err.message : '送出失敗，請稍後再試');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-xl bg-chalk border border-cream p-6 text-center">
        <h3 className="font-serif text-2xl font-bold text-charcoal">已收到您的試聽申請</h3>
        <p className="mt-3 text-charcoal/80 leading-relaxed">
          我們會於 1 個工作日內聯絡您，確認試聽時段。
          <br />
          若想更快收到課程資訊，歡迎加入 LINE。
        </p>
        <a
          href={lineUrl}
          target={lineUrl !== '#' ? '_blank' : undefined}
          rel={lineUrl !== '#' ? 'noopener noreferrer' : undefined}
          className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-caramel px-6 font-medium text-charcoal hover:-translate-y-px transition-transform"
        >
          加 LINE 領取詳細資訊
        </a>
      </div>
    );
  }

  const submitting = status === 'submitting';
  const grades: readonly string[] = options?.grades ?? GRADES;
  const subjectsDisabled = Boolean(options) && !data.grade;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="姓名" required error={errors.name}>
          <input
            type="text"
            data-field="name"
            autoComplete="name"
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            className="form-input"
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <Field label="電話（手機）" required error={errors.phone}>
          <input
            type="tel"
            data-field="phone"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="09xxxxxxxx"
            value={data.phone}
            onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="form-input"
            aria-invalid={Boolean(errors.phone)}
          />
        </Field>

        <Field
          label="Email（選填）"
          error={errors.email as string | undefined}
          hint="留下 Email 我們會自動回覆確認信"
        >
          <input
            type="email"
            data-field="email"
            autoComplete="email"
            inputMode="email"
            placeholder="parent@example.com"
            value={data.email ?? ''}
            onChange={(e) => update('email', e.target.value)}
            className="form-input"
            aria-invalid={Boolean(errors.email)}
          />
        </Field>

        <Field label="就讀學校（選填）" error={errors.school as string | undefined}>
          <input
            type="text"
            data-field="school"
            placeholder="例：嘉義高中"
            value={data.school ?? ''}
            onChange={(e) => update('school', e.target.value)}
            className="form-input"
          />
        </Field>

        <Field label="年級" required error={errors.grade}>
          <select
            data-field="grade"
            value={data.grade ?? ''}
            onChange={(e) => onGradeChange(e.target.value as Grade)}
            className="form-input"
            aria-invalid={Boolean(errors.grade)}
          >
            <option value="">請選擇</option>
            {grades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </Field>

        <Field label="希望試聽時段（選填）" error={errors.preferredTime}>
          <select
            data-field="preferredTime"
            value={data.preferredTime ?? ''}
            onChange={(e) => update('preferredTime', (e.target.value || undefined) as TimeSlot | undefined)}
            className="form-input"
          >
            <option value="">不指定</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* 諮詢科目：依年級學制級聯過濾的複選 chips */}
      <fieldset data-field="subjects">
        <legend className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-charcoal mb-2">
          <span>
            想諮詢的科目
            <span className="text-sienna ml-1">*</span>
          </span>
          <span className="text-xs text-charcoal/55">（可複選）</span>
          {options && stage && (
            <span className="text-xs text-espresso/80">已依「{stage}」課程顯示</span>
          )}
        </legend>

        {subjectsDisabled ? (
          <p className="rounded-md border border-dashed border-cream bg-cream/30 px-3 py-3 text-sm text-charcoal/60">
            請先選擇年級，我們會列出對應的科目。
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {subjectChoices.map((s) => {
              const checked = (data.subjects ?? []).includes(s);
              return (
                <label
                  key={s}
                  className={`group relative cursor-pointer select-none rounded-lg border px-3 py-2.5 text-sm transition-all duration-200 ease-[var(--ease-brand)] ${
                    checked
                      ? 'border-caramel bg-caramel/15 text-charcoal shadow-sm ring-1 ring-caramel/40'
                      : 'border-cream bg-chalk text-charcoal/80 hover:-translate-y-px hover:border-espresso/40 hover:shadow-sm'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleSubject(s)}
                  />
                  <span className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border text-[10px] leading-none transition-colors ${
                        checked
                          ? 'border-caramel bg-caramel text-charcoal'
                          : 'border-espresso/30 bg-transparent text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    {s}
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {errors.subjects && (
          <p className="mt-1.5 text-xs text-sienna">{errors.subjects}</p>
        )}
      </fieldset>

      {/* 進階（選填）：想找的老師 / 希望校區 — 僅在有 DB 選項時顯示 */}
      {options && (
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="想找的老師（選填）"
            error={errors.preferredTeacherSlug as string | undefined}
            hint={
              (data.subjects ?? []).length > 0
                ? '已依您選的科目過濾'
                : '可先選科目再挑老師，或保持不指定'
            }
          >
            <select
              data-field="preferredTeacherSlug"
              value={data.preferredTeacherSlug ?? ''}
              onChange={(e) => update('preferredTeacherSlug', e.target.value)}
              className="form-input"
            >
              <option value="">不指定</option>
              {teacherChoices.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                  {t.englishName ? `（${t.englishName}）` : ''}
                  {t.isTutor ? ' · 1對1家教' : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="希望校區（選填）"
            error={errors.preferredLocationKey as string | undefined}
          >
            <select
              data-field="preferredLocationKey"
              value={data.preferredLocationKey ?? ''}
              onChange={(e) => update('preferredLocationKey', e.target.value)}
              className="form-input"
            >
              <option value="">不指定</option>
              {locationChoices.map((l) => (
                <option key={l.key} value={l.key}>{l.name}</option>
              ))}
            </select>
          </Field>
        </div>
      )}

      <Field label="備註（選填）" error={errors.notes as string | undefined}>
        <textarea
          data-field="notes"
          rows={3}
          maxLength={500}
          placeholder="想特別告訴我們的事，例如：學習狀況、希望解決的問題"
          value={data.notes ?? ''}
          onChange={(e) => update('notes', e.target.value)}
          className="form-input"
        />
      </Field>

      {turnstileSiteKey && (
        <div className="pt-1">
          <Turnstile
            siteKey={turnstileSiteKey}
            onSuccess={(token: string) => update('turnstileToken', token)}
            onError={() => update('turnstileToken', '')}
            onExpire={() => update('turnstileToken', '')}
            options={{ theme: 'light', size: 'flexible' }}
          />
        </div>
      )}

      {submitError && (
        <p role="alert" className="text-sm text-sienna">
          {submitError}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-caramel px-8 font-medium text-charcoal shadow-sm transition-[transform,box-shadow] duration-200 ease-[var(--ease-brand)] hover:-translate-y-px hover:shadow-md disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {submitting && (
            <span
              aria-hidden="true"
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-charcoal/30 border-t-charcoal"
            />
          )}
          {submitting ? '送出中…' : '送出試聽申請'}
        </button>
        <p className="text-xs text-charcoal/60">
          送出後我們會於 1 個工作日內以電話或 LINE 聯絡您。
        </p>
      </div>

      <style>{`
        .form-input {
          width: 100%;
          height: 2.75rem;
          padding: 0 0.75rem;
          border: 1px solid var(--color-cream);
          border-radius: 6px;
          background-color: var(--color-chalk);
          color: var(--color-charcoal);
          font-size: 0.95rem;
          transition: border-color 200ms var(--ease-brand), box-shadow 200ms var(--ease-brand);
        }
        textarea.form-input { height: auto; padding: 0.6rem 0.75rem; line-height: 1.55; }
        .form-input:focus {
          outline: none;
          border-color: var(--color-caramel);
          box-shadow: 0 0 0 3px rgba(200, 161, 101, 0.2);
        }
        .form-input[aria-invalid="true"] {
          border-color: var(--color-sienna);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-charcoal mb-1.5">
        {label}
        {required && <span className="text-sienna ml-1">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-sienna">{error}</span>}
      {!error && hint && (
        <span className="mt-1 block text-xs text-charcoal/55">{hint}</span>
      )}
    </label>
  );
}
