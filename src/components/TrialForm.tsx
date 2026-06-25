import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  trialSchema,
  GRADES,
  RELATIONS,
  GRADE_TO_STAGE,
  type Grade,
  type Relation,
  type TrialFormData,
  type TrialFormOptions,
} from '~/lib/trialSchema';

const WEEKDAY_LABELS = ['', '週一', '週二', '週三', '週四', '週五', '週六', '週日'] as const;

/** 一筆「選課」的草稿狀態（locationFilter 僅 UI 篩選用，不送出）。 */
interface DraftSelection {
  subject: string;
  weekday: number | null;
  locationKey: string | null;
  locationFilter: string; // '' = 全部地點
}

interface FormState {
  name: string;
  phone: string;
  relation: '' | Relation;
  relationOther: string;
  school: string;
  grade: '' | Grade;
  selections: DraftSelection[];
  notes: string;
  courseSlug: string;
  turnstileToken: string;
}

type TopErrors = Partial<Record<'name' | 'phone' | 'relation' | 'relationOther' | 'school' | 'grade' | 'selections', string>>;
type Status = 'idle' | 'submitting' | 'success' | 'error';

function emptySelection(subject = ''): DraftSelection {
  return { subject, weekday: null, locationKey: null, locationFilter: '' };
}

/**
 * 科目顯示名：一般科目加學制前綴（例「高中數學」），但本身已含完整命名者
 * （如「Python 程式設計」）不加前綴，避免「高中Python 程式設計」這種拗口字串。
 */
function subjectLabel(stage: string | undefined, subject: string): string {
  if (subject.includes('Python')) return subject;
  return stage ? `${stage}${subject}` : subject;
}

/**
 * 送出成功後發送「試聽名單」轉換事件給 GA4（generate_lead）與 Meta Pixel（Lead）。
 * 缺對應追蹤腳本時靜默略過；任何錯誤都不影響送出流程。
 */
function trackLeadConversion(d: { grade: string; subjects: string; courseSlug?: string }): void {
  if (typeof window === 'undefined') return;
  try {
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof gtag === 'function') {
      gtag('event', 'generate_lead', {
        event_category: 'trial',
        grade: d.grade,
        subjects: d.subjects,
        course: d.courseSlug || undefined,
      });
    }
  } catch {
    /* 追蹤失敗不阻擋流程 */
  }
  try {
    const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
    if (typeof fbq === 'function') {
      fbq('track', 'Lead', { content_name: 'trial_signup', content_category: d.subjects });
    }
  } catch {
    /* 追蹤失敗不阻擋流程 */
  }
}

interface TrialFormProps {
  endpoint?: string;
  /** DB 驅動的級聯選項（年級 / 科目 / (科目→星期×地點) / 校區）。 */
  options?: TrialFormOptions;
  /** 課程頁帶入的預設課程 slug，連同表單送出供後端歸因。 */
  defaultCourseSlug?: string;
  /** 課程頁帶入的預設科目（會先建立對應的選課卡，待使用者選年級與星期/地點）。 */
  defaultSubjects?: readonly string[];
}

export default function TrialForm({
  endpoint = '/api/trial-signup',
  options,
  defaultCourseSlug,
  defaultSubjects,
}: TrialFormProps) {
  const [form, setForm] = useState<FormState>(() => ({
    name: '',
    phone: '',
    relation: '',
    relationOther: '',
    school: '',
    grade: '',
    selections:
      defaultSubjects && defaultSubjects.length > 0
        ? defaultSubjects.map((s) => emptySelection(s))
        : [emptySelection()],
    notes: '',
    courseSlug: defaultCourseSlug ?? '',
    turnstileToken: '',
  }));
  const [errors, setErrors] = useState<TopErrors>({});
  const [selErrors, setSelErrors] = useState<Record<number, string>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const turnstileSiteKey = useMemo(
    () => (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined) ?? '',
    [],
  );
  const lineUrl = (import.meta.env.PUBLIC_LINE_URL as string | undefined) || '#';

  const stage = form.grade ? GRADE_TO_STAGE[form.grade] : undefined;

  // 科目選項依年級學制過濾。
  const subjectChoices = useMemo<string[]>(() => {
    if (!options || !stage) return [];
    return options.subjectsByGrade[stage] ?? options.allSubjects;
  }, [options, stage]);

  const usedSubjects = useMemo(
    () => new Set(form.selections.map((s) => s.subject).filter(Boolean)),
    [form.selections],
  );

  const locationOrder = useMemo(
    () => new Map((options?.locations ?? []).map((l, i) => [l.key, i])),
    [options],
  );

  /** 取某科目（含可選地點篩選）的「星期×地點」格：rows=星期、cols=地點、可選格=cellSet。 */
  function gridFor(subject: string, locationFilter: string) {
    if (!options || !stage || !subject) return null;
    let cells = options.availability.filter((a) => a.grade === stage && a.subject === subject);
    const allLocations = uniqueLocations(cells);
    if (locationFilter) cells = cells.filter((c) => c.locationKey === locationFilter);
    const locations = uniqueLocations(cells).sort(
      (a, b) => (locationOrder.get(a.key) ?? 99) - (locationOrder.get(b.key) ?? 99),
    );
    const weekdays = [...new Set(cells.map((c) => c.weekday))].sort((a, b) => a - b);
    const cellSet = new Set(cells.map((c) => `${c.locationKey}|${c.weekday}`));
    return { locations, weekdays, cellSet, allLocations };
  }

  function uniqueLocations(cells: TrialFormOptions['availability']) {
    const m = new Map<string, { key: string; short: string; name: string }>();
    for (const c of cells) {
      if (!m.has(c.locationKey)) m.set(c.locationKey, { key: c.locationKey, short: c.locationShort, name: c.locationName });
    }
    return [...m.values()].sort((a, b) => (locationOrder.get(a.key) ?? 99) - (locationOrder.get(b.key) ?? 99));
  }

  /* -------------------- 欄位更新 -------------------- */
  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function onGradeChange(next: '' | Grade) {
    setForm((prev) => {
      const ns = next ? GRADE_TO_STAGE[next] : undefined;
      const allowed = new Set(ns && options ? options.subjectsByGrade[ns] ?? options.allSubjects : []);
      // 換年級 → 學制可能變，星期/地點一律重選；科目若不屬新學制則清空。
      const selections = prev.selections.map((c) =>
        c.subject && allowed.has(c.subject)
          ? { ...c, weekday: null, locationKey: null, locationFilter: '' }
          : emptySelection(),
      );
      return { ...prev, grade: next, selections };
    });
    setSelErrors({});
    setErrors((p) => ({ ...p, grade: undefined, selections: undefined }));
  }

  function patchSelection(i: number, patch: Partial<DraftSelection>) {
    setForm((prev) => {
      const selections = prev.selections.slice();
      selections[i] = { ...selections[i]!, ...patch };
      return { ...prev, selections };
    });
    setSelErrors((prev) => {
      const n = { ...prev };
      delete n[i];
      return n;
    });
  }

  function onSubjectChange(i: number, subject: string) {
    // 換科目 → 星期/地點/地點篩選一律重置。
    patchSelection(i, { subject, weekday: null, locationKey: null, locationFilter: '' });
  }

  function onLocationFilterChange(i: number, locationFilter: string) {
    setForm((prev) => {
      const selections = prev.selections.slice();
      const cur = selections[i]!;
      // 篩選地點若與目前已選格的地點不同，清掉已選星期/地點。
      const clearPick = Boolean(locationFilter) && cur.locationKey !== null && cur.locationKey !== locationFilter;
      selections[i] = {
        ...cur,
        locationFilter,
        weekday: clearPick ? null : cur.weekday,
        locationKey: clearPick ? null : cur.locationKey,
      };
      return { ...prev, selections };
    });
  }

  function onPickCell(i: number, locationKey: string, weekday: number) {
    patchSelection(i, { locationKey, weekday });
  }

  function addSubjectCard() {
    setForm((prev) => ({ ...prev, selections: [...prev.selections, emptySelection()] }));
  }

  function removeSubjectCard(i: number) {
    setForm((prev) => ({ ...prev, selections: prev.selections.filter((_, idx) => idx !== i) }));
    setSelErrors((prev) => {
      const n: Record<number, string> = {};
      for (const [k, v] of Object.entries(prev)) {
        const idx = Number(k);
        if (idx < i) n[idx] = v;
        else if (idx > i) n[idx - 1] = v;
      }
      return n;
    });
  }

  /* -------------------- 送出 -------------------- */
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    // 1) 逐卡檢核（科目/星期/地點皆需到位）。
    const nextSelErrors: Record<number, string> = {};
    form.selections.forEach((c, i) => {
      if (!c.subject) nextSelErrors[i] = '請選擇科目';
      else if (c.weekday == null || !c.locationKey) nextSelErrors[i] = '請在下表選擇一個試聽星期與地點';
    });

    // 2) 組 payload 走共用 schema 檢核其餘欄位。
    const payload: TrialFormData = {
      name: form.name,
      phone: form.phone,
      relation: (form.relation || undefined) as Relation,
      relationOther: form.relation === '其他' ? form.relationOther : '',
      school: form.school,
      grade: form.grade as Grade,
      selections: form.selections
        .filter((c) => c.subject && c.weekday != null && c.locationKey)
        .map((c) => ({ subject: c.subject, weekday: c.weekday as number, locationKey: c.locationKey as string })),
      courseSlug: form.courseSlug,
      notes: form.notes,
      turnstileToken: form.turnstileToken,
    };

    const result = trialSchema.safeParse(payload);
    const nextErrors: TopErrors = {};
    if (!result.success) {
      // 只收 top-level 欄位錯誤（含 selections 的 min/重覆訊息）；逐卡細節走 selErrors。
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof TopErrors | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
    }

    if (Object.keys(nextSelErrors).length > 0 || Object.keys(nextErrors).length > 0) {
      setSelErrors(nextSelErrors);
      setErrors(nextErrors);
      const firstTop = Object.keys(nextErrors)[0];
      if (firstTop) {
        requestAnimationFrame(() => {
          document.querySelector<HTMLElement>(`[data-field="${firstTop}"]`)?.focus?.();
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
      if (!res.ok || !json.ok) throw new Error(json.error || '送出失敗，請稍後再試');
      setStatus('success');
      trackLeadConversion({
        grade: form.grade,
        subjects: payload.selections.map((s) => s.subject).join(','),
        courseSlug: form.courseSlug,
      });
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
  const subjectsLocked = !form.grade;
  const allSubjectsUsed = subjectChoices.length > 0 && subjectChoices.every((s) => usedSubjects.has(s));

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="學生姓名" required error={errors.name}>
          <input
            type="text"
            data-field="name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className="form-input"
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <Field label="家長電話（手機）" required error={errors.phone}>
          <input
            type="tel"
            data-field="phone"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="09xxxxxxxx"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="form-input"
            aria-invalid={Boolean(errors.phone)}
          />
        </Field>

        <Field label="家長與學生關係" required error={errors.relation}>
          <select
            data-field="relation"
            value={form.relation}
            onChange={(e) => updateField('relation', e.target.value as '' | Relation)}
            className="form-input"
            aria-invalid={Boolean(errors.relation)}
          >
            <option value="">請選擇</option>
            {RELATIONS.map((r) => (
              <option key={r} value={r}>{r === '其他' ? '其他（自填）' : r}</option>
            ))}
          </select>
        </Field>

        {form.relation === '其他' ? (
          <Field label="關係（自填）" required error={errors.relationOther}>
            <input
              type="text"
              data-field="relationOther"
              placeholder="例：祖父、監護人"
              value={form.relationOther}
              onChange={(e) => updateField('relationOther', e.target.value)}
              className="form-input"
              aria-invalid={Boolean(errors.relationOther)}
            />
          </Field>
        ) : (
          <Field label="就讀學校" required error={errors.school} hint="已畢業不確定填原校即可">
            <input
              type="text"
              data-field="school"
              placeholder="例：嘉義高中"
              value={form.school}
              onChange={(e) => updateField('school', e.target.value)}
              className="form-input"
              aria-invalid={Boolean(errors.school)}
            />
          </Field>
        )}

        <Field label="年級" required error={errors.grade}>
          <select
            data-field="grade"
            value={form.grade}
            onChange={(e) => onGradeChange(e.target.value as '' | Grade)}
            className="form-input"
            aria-invalid={Boolean(errors.grade)}
          >
            <option value="">請選擇</option>
            {grades.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </Field>

        {/* relation==='其他' 時，就讀學校改放這格以維持兩欄排版 */}
        {form.relation === '其他' && (
          <Field label="就讀學校" required error={errors.school} hint="已畢業不確定填原校即可">
            <input
              type="text"
              data-field="school"
              placeholder="例：嘉義高中"
              value={form.school}
              onChange={(e) => updateField('school', e.target.value)}
              className="form-input"
              aria-invalid={Boolean(errors.school)}
            />
          </Field>
        )}
      </div>

      {/* 選課：每科 = 科目 + 星期×地點單選 */}
      <fieldset data-field="selections">
        <legend className="flex flex-wrap items-baseline gap-x-2 text-sm font-medium text-charcoal mb-2">
          <span>
            想試聽的科目與時段
            <span className="text-sienna ml-1">*</span>
          </span>
          {stage && <span className="text-xs text-espresso/80">已依「{stage}」課程顯示</span>}
        </legend>

        {subjectsLocked ? (
          <p className="rounded-md border border-dashed border-cream bg-cream/30 px-3 py-3 text-sm text-charcoal/60">
            請先選擇年級，我們會列出對應的科目與上課星期/地點。
          </p>
        ) : (
          <div className="space-y-4">
            {form.selections.map((card, i) => {
              const grid = card.subject ? gridFor(card.subject, card.locationFilter) : null;
              const subjectOptionsForCard = subjectChoices.filter(
                (s) => s === card.subject || !usedSubjects.has(s),
              );
              return (
                <div key={i} className="rounded-xl border border-cream bg-chalk/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-charcoal/70 mb-1">
                        科目 {form.selections.length > 1 ? `#${i + 1}` : ''}
                      </label>
                      <select
                        value={card.subject}
                        onChange={(e) => onSubjectChange(i, e.target.value)}
                        className="form-input"
                        aria-invalid={Boolean(selErrors[i])}
                      >
                        <option value="">請選擇科目</option>
                        {subjectOptionsForCard.map((s) => (
                          <option key={s} value={s}>{subjectLabel(stage, s)}</option>
                        ))}
                      </select>
                    </div>
                    {grid && grid.allLocations.length > 1 && (
                      <div className="w-32 shrink-0">
                        <label className="block text-xs font-medium text-charcoal/70 mb-1">地點（選填）</label>
                        <select
                          value={card.locationFilter}
                          onChange={(e) => onLocationFilterChange(i, e.target.value)}
                          className="form-input"
                        >
                          <option value="">全部</option>
                          {grid.allLocations.map((l) => (
                            <option key={l.key} value={l.key}>{l.short}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {form.selections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSubjectCard(i)}
                        className="mt-6 shrink-0 rounded-md border border-cream px-2 py-1.5 text-xs text-charcoal/60 hover:border-sienna/50 hover:text-sienna transition-colors"
                        aria-label={`移除科目 ${i + 1}`}
                      >
                        移除
                      </button>
                    )}
                  </div>

                  {/* 星期×地點單選表 */}
                  {card.subject && grid && (
                    grid.weekdays.length === 0 ? (
                      <p className="mt-3 text-sm text-charcoal/55">此科目目前無可預約的固定班時段，請改選其他科目或於備註說明。</p>
                    ) : (
                      <div className="mt-3 overflow-x-auto">
                        <p className="mb-1.5 text-xs text-charcoal/60">請點選一個想試聽的星期與地點（單選）：</p>
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr>
                              <th className="border border-cream bg-cream/40 px-2 py-1.5 text-left font-medium text-charcoal/70">星期</th>
                              {grid.locations.map((l) => (
                                <th key={l.key} className="border border-cream bg-cream/40 px-2 py-1.5 text-center font-medium text-charcoal/70" title={l.name}>
                                  {l.short}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {grid.weekdays.map((wd) => (
                              <tr key={wd}>
                                <th className="border border-cream bg-chalk px-2 py-1.5 text-left font-normal text-charcoal/80">
                                  {WEEKDAY_LABELS[wd]}
                                </th>
                                {grid.locations.map((l) => {
                                  const available = grid.cellSet.has(`${l.key}|${wd}`);
                                  const picked = card.locationKey === l.key && card.weekday === wd;
                                  return (
                                    <td key={l.key} className="border border-cream p-0 text-center">
                                      {available ? (
                                        <button
                                          type="button"
                                          aria-pressed={picked}
                                          onClick={() => onPickCell(i, l.key, wd)}
                                          className={`flex h-9 w-full items-center justify-center transition-colors ${
                                            picked
                                              ? 'bg-caramel text-charcoal font-semibold'
                                              : 'bg-chalk text-espresso hover:bg-caramel/15'
                                          }`}
                                        >
                                          {picked ? '✓' : '◯'}
                                        </button>
                                      ) : (
                                        <span className="block h-9 w-full bg-cream/20" aria-hidden="true" />
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                  {selErrors[i] && <p className="mt-1.5 text-xs text-sienna">{selErrors[i]}</p>}
                </div>
              );
            })}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={addSubjectCard}
                disabled={allSubjectsUsed}
                className="inline-flex items-center gap-1.5 rounded-lg border border-espresso/40 bg-chalk px-3 py-2 text-sm font-medium text-espresso hover:bg-cream transition-colors disabled:opacity-50 disabled:hover:bg-chalk"
              >
                ＋ 新增科目
              </button>
              {allSubjectsUsed && <span className="text-xs text-charcoal/50">已涵蓋此年級所有可選科目</span>}
            </div>
          </div>
        )}
        {errors.selections && <p className="mt-1.5 text-xs text-sienna">{errors.selections}</p>}
      </fieldset>

      <Field label="備註（選填）">
        <textarea
          data-field="notes"
          rows={3}
          maxLength={500}
          placeholder="想特別告訴我們的事，例如：學習狀況、希望解決的問題"
          value={form.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          className="form-input"
        />
      </Field>

      {turnstileSiteKey && (
        <div className="pt-1">
          <Turnstile
            siteKey={turnstileSiteKey}
            onSuccess={(token: string) => updateField('turnstileToken', token)}
            onError={() => updateField('turnstileToken', '')}
            onExpire={() => updateField('turnstileToken', '')}
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
