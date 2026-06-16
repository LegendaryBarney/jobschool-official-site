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

type FieldErrors = Partial<Record<keyof TrialFormData, string>>;

const initialData: TrialFormData = {
  name: '',
  phone: '',
  email: '',
  school: '',
  grade: undefined as unknown as Grade,
  subjects: [],
  preferredTime: undefined,
  notes: '',
  turnstileToken: '',
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface TrialFormProps {
  endpoint?: string;
  /** 科目選項，由頁面從 courses collection 帶入；未傳則用 schema 預設清單。 */
  subjectOptions?: readonly string[];
}

export default function TrialForm({
  endpoint = '/api/trial-signup',
  subjectOptions = SUBJECTS,
}: TrialFormProps) {
  const [data, setData] = useState<TrialFormData>(initialData);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const turnstileSiteKey = useMemo(
    () => (import.meta.env.PUBLIC_TURNSTILE_SITE_KEY as string | undefined) ?? '',
    [],
  );
  const lineUrl = (import.meta.env.PUBLIC_LINE_URL as string | undefined) || '#';

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

  function toggleSubject(s: Subject) {
    const current = data.subjects ?? [];
    const next = current.includes(s)
      ? current.filter((x) => x !== s)
      : [...current, s];
    update('subjects', next);
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
      setData(initialData);
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

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="姓名" required error={errors.name}>
          <input
            type="text"
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
            autoComplete="email"
            inputMode="email"
            placeholder="parent@example.com"
            value={data.email ?? ''}
            onChange={(e) => update('email', e.target.value)}
            className="form-input"
            aria-invalid={Boolean(errors.email)}
          />
        </Field>

        <Field label="就讀學校" error={errors.school as string | undefined}>
          <input
            type="text"
            placeholder="例：嘉義高中"
            value={data.school ?? ''}
            onChange={(e) => update('school', e.target.value)}
            className="form-input"
          />
        </Field>

        <Field label="年級" required error={errors.grade}>
          <select
            value={data.grade ?? ''}
            onChange={(e) => update('grade', e.target.value as Grade)}
            className="form-input"
            aria-invalid={Boolean(errors.grade)}
          >
            <option value="">請選擇</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </Field>

        <Field label="希望試聽時段" error={errors.preferredTime}>
          <select
            value={data.preferredTime ?? ''}
            onChange={(e) => update('preferredTime', (e.target.value || undefined) as TimeSlot | undefined)}
            className="form-input"
          >
            <option value="">請選擇（可不選）</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-charcoal mb-2">
          想諮詢的科目
          <span className="text-sienna ml-1">*</span>
          <span className="ml-2 text-xs text-charcoal/60">（可複選）</span>
        </legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {subjectOptions.map((s) => {
            const checked = (data.subjects ?? []).includes(s);
            return (
              <label
                key={s}
                className={`cursor-pointer select-none rounded-md border px-3 py-2 text-sm transition-colors ${
                  checked
                    ? 'border-caramel bg-caramel/15 text-charcoal'
                    : 'border-cream bg-chalk text-charcoal/80 hover:border-espresso/40'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggleSubject(s)}
                />
                {s}
              </label>
            );
          })}
        </div>
        {errors.subjects && (
          <p className="mt-1.5 text-xs text-sienna">{errors.subjects}</p>
        )}
      </fieldset>

      <Field label="備註" error={errors.notes as string | undefined}>
        <textarea
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
